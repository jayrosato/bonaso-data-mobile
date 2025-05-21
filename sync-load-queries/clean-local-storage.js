import { querySelector, queryWriter } from '../app/database/queryWriter'

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