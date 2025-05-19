import { querySelector, queryWriter } from '../app/database/queryWriter'

export const syncResponses = async () => {
    const dn = process.env.EXPO_PUBLIC_DOMAIN_NAME
    try{
        console.log('Syncing offline responses, please do not leave connection or close the app')
        const results = await querySelector(`SELECT * FROM responses WHERE is_synced = 0;`, [])
        let responses = []
        let respondents = []
        let responsesRaw = []
        results.forEach((row) => responsesRaw.push(row))
        for(const response of responsesRaw){
            if(typeof response.respondent === 'undefined' || response.respondent === null){
                continue
            }
            let respondent = await querySelector(`SELECT * FROM respondents WHERE id = ?`, [response.respondent])
            respondent = respondent[0]
            if(respondents.filter(r => r.id === respondent.id).length === 0 && typeof respondent !== 'undefined'){
                respondents.push(respondent)
            }
            const answers = await querySelector(`SELECT * FROM answers WHERE response = ?`, [response.id])
            response.answers = answers
            responses.push(response)
        }
        const data = {
            'respondents': respondents,
            'responses': responses
        }
        const response = await fetch(`http://${dn}/forms/mobile/sync/responses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data }),
            })
        const result = await response.json();
        console.log('Response from server:', result.message);
        if(result.message === 'success' && responses.length > 0){
            let syncedIDs = []
            let where = []
            responses.forEach(r => {
                syncedIDs.push(r.id);
                where.push(`id = ?`);
            })
            const whereStatement = where.join(' OR ')
            let query = `UPDATE responses SET is_synced = 1 WHERE ${whereStatement}`
            await queryWriter(query, syncedIDs)
        }
    }

    catch(err){
        console.log(`Error syncing responses. Please try again later.: `, err)
    }
}


