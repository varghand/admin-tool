import axios from "axios";

const AC_API_URL = process.env.ACTIVE_CAMPAIGN_API_URL;
const AC_API_KEY = process.env.ACTIVE_CAMPAIGN_API_KEY;

async function getContactByEmail(email) {
  const res = await axios.get(`${AC_API_URL}/contacts`, {
    params: { email },
    headers: { "Api-Token": AC_API_KEY },
  });
  return res.data.contacts?.[0] || null;
}

async function getOrCreateTag(tagName) {
  const res = await axios.get(`${AC_API_URL}/tags`, {
    params: { search: tagName },
    headers: { "Api-Token": AC_API_KEY },
  });
  const existing = res.data.tags?.find((t) => t.tag === tagName);
  if (existing) return existing.id;

  const createRes = await axios.post(
    `${AC_API_URL}/tags`,
    { tag: { tag: tagName, tagType: "contact" } },
    { headers: { "Api-Token": AC_API_KEY } }
  );
  return createRes.data.tag.id;
}

async function createContact(email) {
  const res = await axios.post(
    `${AC_API_URL}/contacts`,
    {
      contact: {
        email: email.trim(),
        status: 1, // Set user as confirmed right away
      },
    },
    { headers: { "Api-Token": AC_API_KEY } }
  );
  return res.data.contact;
}

export async function triggerActiveCampaignAutomation(email, tagName) {
  email = email.trim();
  let contact = await getContactByEmail(email);
  if (!contact) {
    contact = await createContact(email);
  }

  const tagId = await getOrCreateTag(tagName);

  await axios.post(
    `${AC_API_URL}/contactTags`,
    {
      contactTag: {
        contact: contact.id,
        tag: tagId,
      },
    },
    { headers: { "Api-Token": AC_API_KEY } }
  );

  return { success: true, message: `Tag '${tagName}' applied to ${email}` };
}
