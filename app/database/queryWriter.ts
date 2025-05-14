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