import { loadLocalByID, loadLocalFromArray } from '@/app/database/queryWriter';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from "react-hook-form";
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';


export default function NewResponse(){
    //load necessary information about the form
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
    //basic components to replicate radio buttons/checkboxes 
    function RadioButtons( { options } ){
        const [selected, setSelected] = useState([])
        return(
            <View>
                {options.map(option => (
                    <View key={option.id}>
                        <Text>{option.text}</Text>
                        <Ionicons name={selected.includes(option) ? 'radio-button-on-outline' : 'radio-button-off-outline'} 
                        color={'red'} size={24} onPress={() => selected.includes(option) ? setSelected([]) : setSelected([option])} />
                    </View>
                ))}
            </View>
        )
        
    }
    function YNButtons(){
        const options = ['Yes', 'No']
        const [selected, setSelected] = useState([])
        return(
            <View>
                {options.map(option => (
                    <View key={option}>
                        <Text>{option}</Text>
                        <Ionicons name={selected.includes(option) ? 'radio-button-on-outline' : 'radio-button-off-outline'} 
                        color={'red'} size={24} 
                        onPress={() => selected.includes(option) ? setSelected([]) : setSelected([option])} />
                    </View>
                ))}
            </View>
        )
    }
    function Checkboxes( { options } ){
        const [selected, setSelected] = useState([])
        return(
            <View>
                {options.map(option => (
                    <View key={option.id}>
                        <Text>{option.text}</Text>
                        <Ionicons name={selected.includes(option) ? 'checkbox' : 'checkbox-outline'} 
                        color={'red'} size={24} onPress={() => 
                        selected.includes(option) ? 
                            setSelected(selected.filter(s => s.id !== option.id)) : 
                            option.special === 'None of the above' || option.special === 'All'? 
                                setSelected([option]) : 
                                selected.filter(s => s.special === 'None of the above' || s.special === 'All').length > 0 ?
                                    setSelected([option]) : 
                            setSelected([...selected, option])} 
                        />
                    </View>
                ))}
            </View>
        )
        
    }

    //standard code for handling submit
    const {control, handleSubmit, formState: { errors }, } = useForm({
        defaultValues: {firstName: "", lastName: "",},})

    const onSubmit = (data) => console.log(data)

    //return the actual form
    if (loading) return <Text>Loading...</Text>;
    if (!form.questions || form.questions.length === 0) return <Text>This form has no questions.</Text>;
    if(form.questions.length > 0){
        const questions = form.questions
        return (
            <ScrollView>
                <Controller control={control} rules={{ required: true, maxLength: 255 }}
                    render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        placeholder={questions[0].text}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                    />
                    )}
                    name="firstName"
                />
                {errors.firstName && <Text>This is required.</Text>}
                <YNButtons />
                <RadioButtons options={questions[0].options} />
                <Checkboxes options={questions[1].options} />

                <Button title="Submit" onPress={handleSubmit(onSubmit)} />
            </ScrollView>
        )
    }
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    padding: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});