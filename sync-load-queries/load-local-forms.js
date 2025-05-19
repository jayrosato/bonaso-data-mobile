import { querySelector } from '../app/database/queryWriter';



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