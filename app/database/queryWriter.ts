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
        console.error('Failed to write query:', err);
        throw err;
    }
};
//common queries below are mapped as functions

export const syncForms = async () => {
    try{
        console.log('syncing')
        const response = await fetch('http://192.168.0.198:8000/forms/mobile/getforms');
        const forms = await response.json();
        const query = 'INSERT OR REPLACE INTO  forms (id,  form_name, organization, organization_name, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)';
        for (const form of forms) {
            await queryWriter(query, [
                        form.id,
                        form.form_name,
                        form.organization,
                        form.organization_name,
                        form.start_date,
                        form.end_date
                    ])
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