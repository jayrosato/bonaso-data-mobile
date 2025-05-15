import openDB from './dbManager';

export const queryWriter = async (query: string, params = []) => {
    try {
        const db = await openDB();
        const result = await db.runAsync(query, params);
        return result;
    } 
    catch (err) {
        console.error('Failed to write query:', err);
        throw err;
    }
};

export const querySelector = async (query: string, params = []) => {
    try {
        const db = await openDB();
        const result = await db.getAllAsync(query, params);
        return result;
    } 
    catch (err) {
        console.error('Failed to get query:', err);
        throw err;
    }
};

export const loadLocalByID = async(table, column, value) => {
    try{
        console.log(`Pulling records from ${table} where ${column}=${value}`);
        const results = await querySelector(`SELECT * FROM ${table} WHERE ${column} = ?`, [value]);
        if (Array.isArray(results) && results.length > 0) {
            return results;
        } 
        else {
            console.warn(`No record found in ${table} with ${column}=${value}`);
            return null;
        }
    }
    catch(err){
        console.error(`Error fetching records from ${table}`, err)
    }
}

export const loadLocalFromArray = async(table, column, values:any[]) => {
    if(!values || values.length === 0){
        console.warn('No values provided')
        return []
    }
    let clauseArray = []
    values.forEach((val) => {
        clauseArray.push(`${column} = ?`)
    })
    const clause = clauseArray.join(` OR `)
    try{
        console.log(`Pulling records from ${table} where ${column}=${values}`);
        const results = await querySelector(`SELECT * FROM ${table} WHERE ${clause}`, values);
        if (Array.isArray(results) && results.length > 0) {
            return results;
        } 
        else {
            console.warn(`No record found in ${table} with ${values} in ${column}`);
            return null;
        }
    }
    catch(err){
        console.error(`Error fetching records from ${table}`, err)
    }
}

//common queries below are mapped as functions
export const syncForms = async () => {
    try{
        console.log('syncing')
        const dn = process.env.EXPO_PUBLIC_DOMAIN_NAME
        const response = await fetch(`http://${dn}/forms/mobile/getforms`);
        const forms = await response.json();
        const formQuery = 'INSERT OR REPLACE INTO  forms (id,  form_name, organization, organization_name, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)';
        const questionQuery = 'INSERT OR REPLACE INTO questions (id, form, question_index, question, question_type) VALUES (?, ?, ?, ?, ?)';
        const optionQuery = 'INSERT OR REPLACE INTO options (id, question, option_text, special) VALUES (?, ?, ?, ?)';
        const logicQuery = 'INSERT OR REPLACE INTO logic (id, question, conditional_operator, limit_options) VALUES (?, ?, ?, ?)';
        const ruleQuery = 'INSERT OR REPLACE INTO logic_rules (id, logic, parent_question, expected_value, value_comparison, negate_value) VALUES (?,?,?,?,?,?)';
        for (const form of forms) {
            await queryWriter(formQuery, [
                        form.id,
                        form.form_name,
                        form.organization.organization_id,
                        form.organization.organization_name,
                        form.start_date,
                        form.end_date
                    ]);
            for(const fq of form.form_questions){
                await queryWriter(questionQuery, [
                    fq.id,
                    form.id,
                    fq.index,
                    fq.question,
                    fq.question_type
                ])
                if(fq.options.length > 0){
                    for(const option of fq.options){
                        await queryWriter(optionQuery, [
                            option.id,
                            fq.id,
                            option.option_text,
                            option.special
                        ])
                    }
                }
                if(fq.logic){
                    const logic = fq.logic
                    await queryWriter(logicQuery, [
                        logic.id,
                        fq.id,
                        logic.conditional_operator,
                        logic.limit_options
                    ])
                    for(const rule of logic.rules){
                        await queryWriter(ruleQuery, [
                            rule.id,
                            logic.id,
                            rule.parent_question,
                            rule.expected_values,
                            rule.value_comparison,
                            rule.negate_value
                        ])
                    }
                }
            }
        }
        console.log('Offline forms are up to date!')
    }
    catch(err){
        console.error('Error fetching records: ', err)
    } 
}

export const loadLocalForms = async () => {
    try{
        console.log('loading from local storage')
        const results = await querySelector('SELECT * FROM forms', []);
        console.log('Query Returned: ', results)
        let forms = [];
        results.forEach((row) => forms.push(row))
        return forms
    }
    catch(err){
        console.error('Failed to fetch local data: ', err)
        return []
    }
}


export const syncResponses = async () => {
    console.log('Syncing offline responses, please do not leave connection or close the app')
    try{
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

        const dn = process.env.EXPO_PUBLIC_DOMAIN_NAME
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

export const cleanLocalStorage = async () => {
    try{
        console.log('Cleaning Local Storage...')
        //if a response is sycned, it can be safely removed from local storage
        let results = await querySelector(`SELECT * FROM responses WHERE is_synced = 1`)
        if(results.length > 0){
            let syncedIDs = []
            let where = []
            let whereA = []
            results.forEach(r => {
                syncedIDs.push(r.id);
                where.push('id = ?');
                whereA.push('response = ?');
            })
            let whereStatement = whereA.join(' OR ')
            await queryWriter(`DELETE FROM answers WHERE ${whereStatement}`, syncedIDs)
            whereStatement = where.join(' OR ')
            await queryWriter(`DELETE FROM responses WHERE ${whereStatement}`, syncedIDs)
            const check = await querySelector('SELECT * FROM responses')
            const checkA = await querySelector('SELECT * FROM answers')

            console.log(check)
            console.log(checkA)
            console.log('Successfuly cleared synced data')
        }
        results = await querySelector(`SELECT * FROM responses WHERE respondent IS NULL`)
        if(results.length > 0){
            let syncedIDs = []
            let where = []
            let whereA = []
            results.forEach(r => {
                syncedIDs.push(r.id);
                where.push('id = ?');
                whereA.push('response = ?');
            })
            let whereStatement = whereA.join(' OR ')
            await queryWriter(`DELETE FROM answers WHERE ${whereStatement}`, syncedIDs)
            whereStatement = where.join(' OR ')
            await queryWriter(`DELETE FROM responses WHERE ${whereStatement}`, syncedIDs)
            console.log('Successfuly cleared synced data')
        }
        else{
            console.log('All data is cleaned!')
        }
    }
    
    catch(err){
        console.error('Failed to clean local storage. Will try again later.', err)
    }
}


//prevent dual uploading here
export const storeResponseLocally = async (data) => {
    try{
        console.log('Storing response locally')
        console.log(Object.keys(data))
        const created_by = data.created_by;
        const created_on = data.created_on;
        const formID = data.form;
        const respInfo = data.response_data;

        const respondentQuery = `INSERT OR REPLACE INTO respondents (linked_id, id_no, fname, lname, dob, 
        sex, ward, village, district, citizenship, email, contact_no, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const respondentVals = [
            respInfo.linked_id, respInfo.id_no, respInfo.fname, respInfo.lname, respInfo.dob, respInfo.sex, respInfo.ward,
            respInfo.village, respInfo.district, respInfo.citizenship, respInfo.email, respInfo.contact_no
        ]
        await queryWriter(respondentQuery, respondentVals)

        let respondentID = await querySelector(`SELECT MAX(id) FROM respondents;`)
        respondentID = respondentID[0]['MAX(id)']

        const responseQuery = `INSERT OR REPLACE INTO responses (respondent, form, created_on, created_by) 
            VALUES (?, ?, ?, ?)`
        const responseVals = [respondentID, formID, created_on, created_by]
        await queryWriter(responseQuery, responseVals) //currently assuming all responses are new and uneditable in the app
        
        let responseID = await querySelector(`SELECT MAX(id) FROM responses;`)
        responseID = responseID[0]['MAX(id)']
        const answerQuery = `INSERT OR REPLACE INTO answers (response, question, option, open_answer)
            VALUES (?, ?, ?, ?)`
        //hope this works
        const questions = Object.fromEntries(Object.entries(respInfo).filter(([key]) => Number.isInteger(Number(key))));
        for(const [qID, answers] of Object.entries(questions)) {
            const question = parseInt(qID)
            if(Array.isArray(answers)){
                if(answers.length === 0){
                    continue
                }
                if(answers[0] instanceof Object){ //object is a single/multi select returning an option object
                    for(const answer of answers){
                        const option = answer.id
                        await queryWriter(answerQuery, [responseID, question, option, null])
                    }
                }
                else{ //object is a yes/no, returning an array of a single string, get the first object
                    await queryWriter(answerQuery, [responseID, question, null, answers[0]])
                }
            }
            else if(!answers === null){ //text/number, record value directly
                await queryWriter(answerQuery, [responseID, question, null, answers])
            }
        }
        console.log('Response stored locally. Will upload next time connection is found.')
    }
    catch(err){
        console.error('Failed to store data locally: ', err)
    }
}