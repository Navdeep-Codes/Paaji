const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

async function handleHcdMe(slackId) {
  return new Promise((resolve, reject) => {
    base(process.env.USERS_TABLE_NAME)
      .select({
        filterByFormula: `{Slack ID} = '${slackId}'`,
        maxRecords: 1
      })
      .firstPage((err, records) => {
        if (err) {
          console.error('Airtable error:', err);
          return resolve('Hmm looks this aint working. No problem we got yor cash saved! :money_with_wings: ');
        }
        if (!records || records.length === 0) {
          return resolve('Looks like you havent signed up!');
        }
        const rec = records[0].fields;
        let partyName = "";
        if (Array.isArray(rec['Party Name'])) {
          partyName = rec['Party Name'].join(', ');
        } else {
          partyName = rec['Party Name'] || "";
        }

        resolve(`*Your HCD Info:*\nBalance: *${rec.Balance}* :neocat_up_paws:\nParty Name: ${partyName} \nRole: *${rec.Role}*`);
      });
  });
}

module.exports = { handleHcdMe };