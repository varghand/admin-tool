import jwt from "jsonwebtoken";
import axios from "axios";
import zlib from "zlib";
import { parse } from "csv-parse/sync";

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
    }
  );
}

export async function getAppleIAPSales(year, month) {
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

  const formatted = parsedRecords.map((row) => ({
    customer_name: "",
    created_date: "",
    payment_source: "Apple IAP",
    products: [
      {
        title: row["Title"],
        id: row["SKU"],
        quantity: parseInt(row["Units"], 10),
      },
    ],
    title: row["Title"],
    proceeds: parseFloat(row["Developer Proceeds"] || "0"),
    total_price: parseFloat(row["Customer Price"] || "0").toFixed(2),
    currency: row["Currency of Proceeds"],
    country: row["Country Code"],
    fee: (
      parseFloat(row["Customer Price"] || "0") -
      parseFloat(row["Developer Proceeds"] || "0")
    ).toFixed(2),
  }));

  const filteredRecords = formatted.filter((record) => record.total_price > 0);

  return filteredRecords;
}
