import { loadLocalByID, loadLocalFromArray } from '@/app/database/queryWriter';
import LoadingScreen from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';
import theme from '@/themes/theme';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
export default function FormDetail(){
    const { id } = useLocalSearchParams();
    const [form, setForm] = useState({
        id: null,
        name: null,
        organization:{
            id: null,
            name: null
        },
        start_date:null,
        end_date:null,
        questions: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
            const initForm = async () => {
                const form = await loadLocalByID('forms', 'id', id);
                console.log('Form Info',form);

                const questions = await loadLocalByID('questions', 'form', id);
                console.log('Questions', questions)

                let qIDs = [];
                if(questions && questions.length > 0){
                    questions.forEach(question => {
                    qIDs.push(question.id)
                });
                }
                
                const options = await loadLocalFromArray('options', 'question', qIDs);
                console.log('Options', options)
                const qLogic = await loadLocalFromArray('logic', 'question', qIDs);
                console.log('Logic', qLogic)
                let qLogicIDs = [];
                if(qLogic && qLogic.length > 0){
                    qLogic.forEach(logic => {
                    qLogicIDs.push(logic.id)
                });
                }
                let rules = null;
                if(qLogicIDs.length > 0){
                    rules = await loadLocalFromArray('logic_rules', 'logic', qLogicIDs)
                    console.log('rules', rules)
                }
                let questionsArray = [];
                if(questions && questions.length > 0){
                    for(const q of questions){
                        const question = {
                            'id': q.id,
                            'index': q.question_index,
                            'text': q.question,
                            'type': q.question_type,
                            'options': [],
                            'logic': []
                        };
                        let matchOptions = [];
                        if(options && options.length > 0){
                            options.forEach(option => {
                                if(option.question === q.id){
                                    matchOptions.push(option)
                                };
                            });
                        }
                        if(matchOptions.length > 0){
                            for(const o of matchOptions){
                                const option = {
                                    'id': o.id,
                                    'text':o.option_text,
                                    'special': o.special
                                };
                                question.options.push(option);
                            };
                        };
                        let matchLogic = [];
                        if(qLogic && qLogic.length > 0){
                            qLogic.forEach(logic => {
                                if(logic.question === q.id){
                                    matchLogic.push(logic)
                                };
                            });
                        }
                        if(matchLogic.length > 0){
                            for(const log of matchLogic){
                                const logic = {
                                    'id': log.id,
                                    'conditional_operator': log.conditional_operator,
                                    'limit_options': log.limit_options,
                                    'rules': []
                                };
                                let matchRules = [];
                                if(rules && rules.length > 0){
                                    rules.forEach(rule => {
                                        if(rule.logic === log.id){
                                            matchRules.push(rule)
                                        };
                                    });
                                }
                                if(matchRules.length > 0){
                                    for(const r of matchRules){
                                        const rule = {
                                            'id': r.id,
                                            'parent_question': r.parent_question,
                                            'expected_value': r.expected_value,
                                            'value_comparison': r.value_comparison,
                                            'negate_value': r.negate_value
                                        }
                                        logic.rules.push(rule)
                                    }
                                    question.logic.push(logic);
                                }
                                else{
                                    console.warn(`${q.question}'s logic has no associated rules. Logic for this question will not work.`)
                                }
                                
                            };
                        };
                        questionsArray.push(question)
                    }
                }
                setForm({
                    id: form[0].id,
                    name: form[0].form_name,
                    organization:{
                        id: form[0].organization,
                        name: form[0].organization_name
                    },
                    start_date: form[0].start_date,
                    end_date: form[0].end_date,
                    questions: questionsArray
                })
                setLoading(false);
            }
            initForm()
        }, [id]);


    function Question( { question } ){
        if(question.options.length>0){
            console.log(question.options)

            function Options(){
                return(
                    <View style={styles.optionContainer}>
                        {question.options.map((o, index) =>(
                            <ThemedText key={o.id}>{index+1}. {o.text}</ThemedText>
                        ))}
                    </View>
                )
            }
            
            return(
                <View key={form.id} style={styles.questionContainer}>
                    <ThemedText type="subtitle">{question.index +1}. {question.text}</ThemedText>
                    <ThemedText type="defaultSemiBold">{question.type}</ThemedText>
                    <Options />
                </View>
            );
        }
        else{
            return(
                <View key={form.id} style={styles.questionContainer}>
                    <ThemedText type="subtitle">{question.text}</ThemedText>
                    <ThemedText type="defaultSemiBold">{question.type}</ThemedText>
                </View>
            );
        };
    }

    if(loading){ return <LoadingScreen /> }
    if (!form.questions || form.questions.length === 0) return <ThemedText>This form has no questions.</ThemedText>;
    if(form.questions.length > 0){
        return(
            <ScrollView style={styles.container}>

                <View style={styles.titleContainer}>
                    <ThemedText type="title">{form.name}</ThemedText>
                    <ThemedText type="subtitle">From {form.organization.name}</ThemedText>
                </View>

                <View style={styles.titleContainer}>
                    {form.questions.map(q => <Question key={q.id} question={q} />)}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        padding: 30,
    },
    titleContainer: {
        marginBottom: 20,
    },
    optionContainer: {
        left: 30,
    },
  questionContainer: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.darkAccent,
    gap: 8,
    marginBottom: 8,
    flexDirection:'column',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});