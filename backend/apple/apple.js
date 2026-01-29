import jwt from "jsonwebtoken";
import axios from "axios";
import zlib from "zlib";
import { parse } from "csv-parse/sync";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

function generateToken() {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iss: process.env.APPLE_ISSUER_ID,
      exp: now + 1200,
      aud: "appstoreconnect-v1",
    },
    process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    {
      algorithm: "ES256",
      header: {
        alg: "ES256",
        kid: process.env.APPLE_KEY_ID,
        typ: "JWT",
      },
    },
  );
}

export async function getAppleIAPSales(year, month) {
  const yearMonthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  const requestedDate = new Date(Date.UTC(year, month, 1));
  const now = new Date();
  const firstDayOfCurrentMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  if (requestedDate < firstDayOfCurrentMonth) {
    const existing = await dynamoClient.send(
      new GetItemCommand({
        TableName: process.env.SALES_REPORT_TABLE,
        Key: marshall({ yearMonth: yearMonthKey, salesChannel: "Apple IAP" }),
      }),
    );

    if (existing.Item) {
      return unmarshall(existing.Item).sales;
    }
  }

  const token = generateToken();

  const date = `${year}-${String(month).padStart(2, "0")}`;
  const url = "https://api.appstoreconnect.apple.com/v1/salesReports";

  let res;
  try {
    res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "arraybuffer",
      params: {
        "filter[frequency]": "MONTHLY",
        "filter[reportType]": "SALES",
        "filter[reportSubType]": "SUMMARY",
        "filter[vendorNumber]": process.env.APPLE_VENDOR_ID,
        "filter[reportDate]": date,
      },
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return [];
    } else {
      throw error;
    }
  }

  const buffer = zlib.gunzipSync(res.data);
  const csv = buffer.toString("utf8");

  const parsedRecords = parse(csv, {
    columns: (header) => header.map((h) => h.trim()),
    skip_empty_lines: true,
    delimiter: "\t",
  });

  const formatted = parsedRecords.map((row) => {
    const quantity = parseInt(row["Units"], 10);
    const totalPrice = parseFloat(row["Customer Price"] || "0");
    const proceeds = parseFloat(row["Developer Proceeds"] || "0");

    return {
      id: `${row["SKU"]}-${date}`,
      created_date: "",
      payment_source: "Apple IAP",

      product_id: row["SKU"] || row["Title"],
      product_title: row["Title"],
      quantity,
      unit_price: quantity > 0 ? totalPrice / quantity : 0,
      total_price: totalPrice.toFixed(2),

      currency: row["Currency of Proceeds"],
      country: row["Country Code"],
      customer_name: "",

      fee: (totalPrice - proceeds).toFixed(2),
      shipping_cost: 0,
    };
  });

  const filteredRecords = formatted.filter((record) => record.total_price > 0);

  if (requestedDate < firstDayOfCurrentMonth) {
    await dynamoClient.send(
      new PutItemCommand({
        TableName: process.env.SALES_REPORT_TABLE,
        Item: marshall({
          yearMonth: yearMonthKey,
          salesChannel: "Apple IAP",
          sales: formatted,
        }),
      }),
    );
  }

  return filteredRecords;
}
