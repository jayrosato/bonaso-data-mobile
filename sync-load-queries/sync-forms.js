import { queryWriter } from '../app/database/queryWriter';

export const syncForms = async (userID) => {
    const dn = process.env.EXPO_PUBLIC_DOMAIN_NAME
    try{
        console.log('syncing')
        const response = await fetch(`http://${dn}/forms/mobile/getforms/${userID}`);
        const forms = await response.json();
        if(forms){
            await queryWriter('DELETE FROM forms');
            await queryWriter('DELETE FROM questions');
            await queryWriter('DELETE FROM options');
            await queryWriter('DELETE FROM logic');
            await queryWriter('DELETE FROM logic_rules');
        }
        const formQuery = 'INSERT OR REPLACE INTO  forms (id,  form_name, organization, organization_name, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)';
        const questionQuery = 'INSERT OR REPLACE INTO questions (id, form, question_index, question, question_type) VALUES (?, ?, ?, ?, ?)';
        const optionQuery = 'INSERT OR REPLACE INTO options (id, option_id, question, option_text, special) VALUES (?,?, ?, ?, ?)';
        const logicQuery = 'INSERT OR REPLACE INTO logic (id, question, conditional_operator) VALUES (?, ?, ?)';
        const ruleQuery = 'INSERT OR REPLACE INTO logic_rules (id, logic, parent_question, expected_value, value_comparison, limit_options, negate_value) VALUES (?,?,?,?,?,?,?)';
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
                        let optionID = [option.id, fq.id]
                        optionID = optionID.join('')
                        await queryWriter(optionQuery, [
                            optionID,
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
                    ])
                    for(const rule of logic.rules){
                        await queryWriter(ruleQuery, [
                            rule.id,
                            logic.id,
                            rule.parent_question,
                            rule.expected_values,
                            rule.value_comparison,
                            rule.limit_options,
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