import { querySelector, queryWriter } from '../app/database/queryWriter';

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