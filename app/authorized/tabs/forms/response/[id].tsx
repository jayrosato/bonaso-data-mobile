import { loadLocalByID, loadLocalFromArray } from '@/app/database/queryWriter';
import { ThemedText } from '@/components/ThemedText';
import { useConnection } from '@/context/ConnectionContext';
import { storeResponseLocally } from '@/sync-load-queries/store-local-response';
import { syncResponses } from '@/sync-load-queries/sync-responses';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { Button, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { showMessage } from "react-native-flash-message";

    //basic components to replicate radio buttons/checkboxes 
function RadioButtons( { question } ){
    const { control, setValue } = useFormContext();
    useEffect(() => {
        setValue(question.id.toString(), []);
    }, [question.id, setValue]);

    const options = question.options
    return(
        <Controller control={control} name={question.id.toString()} defaultValue={null}
            render={({ field: {onChange, value}}) => {
                const selected = value || [];
                const toggleOption = (option) => {
                    const isSelected = selected.id === option.id;
                    if(isSelected){
                        onChange([])
                    }
                    else{
                        onChange([option])
                    }}
                    return(
                        <View>
                            {options.map(option => (
                                <View key={option.id} style={styles.options}>
                                    <TouchableOpacity onPress={() => toggleOption(option)}>
                                        <Ionicons
                                            name={selected.id === option.id ? 'radio-button-on-outline' : 'radio-button-off-outline'}
                                            size={24}
                                            color="red"
                                        />
                                    </TouchableOpacity>
                                    <Text>{option.text}</Text>
                                </View>
                            ))}
                        </View>
                    )
            }}
        />
    ) 
}

function YNButtons({ question }){
    const options = ['Yes', 'No']
    const { control, setValue } = useFormContext();
    useEffect(() => {
        setValue(question.id.toString(), []);
    }, [question.id, setValue]);

    return(
        <Controller control={control} name={question.id.toString()} defaultValue={[]}
            render={({ field: {onChange, value}}) => {
                const selected = value || [];
                const toggleOption = (option) => {
                    const isSelected = selected.some(s => s === option);;
                    if(isSelected){
                        onChange([])
                    }
                    else{
                        onChange([option])
                    }}
                    return(
                        <View>
                            {options.map(option => (
                                <View key={option} style={styles.options}>
                                    <TouchableOpacity onPress={() => toggleOption(option)}>
                                        <Ionicons
                                            name={selected.some(s => s === option) ? 'radio-button-on-outline' : 'radio-button-off-outline'}
                                            size={24}
                                            color="red"
                                        />
                                    </TouchableOpacity>
                                    <Text>{option}</Text>
                                </View>
                            ))}
                        </View>
                    )
            }}
        />
    )
}
//need to find a way to clear this if hidden
function Checkboxes( { question, onlyShow=null } ){
    const { control, setValue, getValues } = useFormContext();
    let options = question.options
    if(Array.isArray(onlyShow) && onlyShow.some(opt => opt && typeof opt === 'object')){
        if(onlyShow[0].special !== 'All'){
            let osText = []
            onlyShow.forEach(opt => osText.push(opt.text.trim().toLowerCase()))
            options = options.filter(option => osText.includes(option.text.trim().toLowerCase()) || option.special === 'None of the above')
        }
    }
    useEffect(() => {
        setValue(question.id.toString(), []);
    }, [question.id, setValue]);

    return(
        <Controller control={control} name={question.id.toString()} defaultValue={[]}
            render={({ field: {onChange, value }}) => {
                const selected = value || [];
                const toggleOption = (option) => {
                const isSelected = selected.some(s => s.id === option.id);
                const hasSpecial = selected.some(s => s.special === 'None of the above' || s.special === 'All');

                if(isSelected){
                    onChange(selected.filter(s => s.id !== option.id));
                }
                else if(option.special === 'None of the above' || option.special === 'All'){
                    onChange([option])
                }
                else if(hasSpecial){
                    onChange([option]);
                }
                else{
                    onChange([...selected, option]);
                }
            }
            return(
                <View>
                    {options.map(option => ( 
                        <View key={option.id} style={styles.options}>
                            <TouchableOpacity onPress={() => toggleOption(option)}>
                                <Ionicons
                                    name={selected.some(s => s.id === option.id) ? 'checkbox' : 'checkbox-outline'}
                                    size={24}
                                    color="red"
                                />
                            </TouchableOpacity>
                            <Text>{option.text}</Text>
                        </View>
                    ))}
                </View>
            )
        }}
        />
    )
}

function Question({ question }){
    const { control } = useFormContext();
    const watchedValues = {};
    const rules = question.logic?.[0]?.rules || [];
    const [selected, setSelected] = useState(null)
    for (let rule of rules) {
        watchedValues[rule.parent_question] = useWatch({
            control: control,
            name: rule.parent_question.toString(),
        });
    }

    let show = true
    if(rules.length > 0){
        const logic = question.logic?.[0];
        const operator = logic.conditional_operator;
        const evaluateRule = (rule) =>{
            let val = watchedValues[rule.parent_question];
            let match = false;
            if(typeof val === 'undefined'){
                return match
            }
            if(Array.isArray(val) && val.length === 0){
                return match
            }
            if (Array.isArray(val) && val.some(v => v && typeof v === 'object' && v.special === 'None of the above')){
                return match
            }
            const expected = rule.expected_value;
            const comparison = rule.value_comparison;
            const negate = rule.negate_value;
            const limitOptions = rule.limit_options;
            if(comparison === null || comparison === 'MATCHES'){
                if(!Array.isArray(val)){
                    val = [val]
                }
                if(val.includes(expected)){
                    match = true
                }
            }
            //assume that these will always be text inputs and will return a single value
            else if(comparison === 'CONTAINS'){
                match = val.includes(expected) ? true : false
            }
            else if(comparison === 'DOES NOT CONTAIN'){
                match = val.includes(expected) ? false : true
            }
            else if(comparison === 'GREATER THAN'){
                match = val > expected ? true : false
            }
            else if(comparison === 'LESS THAN'){
                match = val < expected ? true : false
            }
            if(limitOptions && val !== selected){
                setSelected(val)
            }
            return negate ? !match : match
        }
        if(operator === 'AND'){
            show = rules.every(evaluateRule)
        }
        if(operator === 'OR'){
            show = rules.some(evaluateRule)
        }
    }

    if (!show) return null
    
    if(question.type === 'Text'){
        return(
            <View>
                <ThemedText type="defaultSemiBold">{question.text}</ThemedText>
            <Controller control={control} rules={{  }}
                render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                    placeholder="Type answer here..."
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                />
                )}
                name={question.id.toString()}
            />
            </View>
        )
    }
    if(question.type === 'Number'){
        return(
            <View>
                <ThemedText type="defaultSemiBold">{question.text}</ThemedText>
                <Controller control={control} rules={{ min:0 }}
                    render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        placeholder="Type any number here..."
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                    />
                    )}
                    name={question.id.toString()}
                />
            </View>
        )
    }
    if(question.type === 'Yes/No'){
        return(
            <View>
                <ThemedText type="defaultSemiBold">{question.text}</ThemedText>
                <YNButtons question = {question} />
            </View>
        )
    }
    if(question.type === 'Single Selection'){
        return(
            <View>
                <ThemedText type="defaultSemiBold">{question.text}</ThemedText>
                <RadioButtons question={question} />
            </View>
        )
    }
    if(question.type === 'Multiple Selections'){
        return(
            <View>
                <ThemedText type="defaultSemiBold">{question.text}</ThemedText>
                <Checkboxes question={question} onlyShow={selected}/>
            </View>
        )
    }
}

export default function NewResponse(){
    //load necessary information about the form
    const { isConnected, isServerReachable } = useConnection();
    const router = useRouter();

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

                const questions = await loadLocalByID('questions', 'form', id);
                console.log(questions)

                let qIDs = [];
                if(questions && questions.length > 0){
                    questions.forEach(question => {
                    qIDs.push(question.id)
                });
                }
                const options = await loadLocalFromArray('options', 'question', qIDs);
                const qLogic = await loadLocalFromArray('logic', 'question', qIDs);
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
                                    'id': o.option_id,
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
                                            'negate_value': r.negate_value,
                                            'limit_options': r.limit_options,
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

    //standard code for handling submit
    const methods = useForm();
    const { control, handleSubmit, formState: { errors } } = methods;

    const onSubmit = async (data) => {
        console.log('Preparing to store response locally', data);
        const responsePackage = {  form: form.id,
                                            created_on: Date.now()/1000,
                                            response_data: data
                                        }
        await storeResponseLocally(responsePackage)
        if(isServerReachable){
            await syncResponses()
        }
        showMessage({message: "Your response has been successfuly recorded", type: "info",});
        router.push({pathname: '/authorized/tabs/forms'})
    }

    //return the actual form
    if (loading) return <Text>Loading...</Text>;
    if (!form.questions || form.questions.length === 0) return <Text>This form has no questions.</Text>;
    if(form.questions.length > 0){
        const questions = form.questions
        return (
            <FormProvider {...methods}>
            <ScrollView style={styles.container}>
                <ThemedText type="title">New Response for {form.name}</ThemedText>
                <ThemedText>{questions.length} questions (max)</ThemedText>
                    <View>
                        <ThemedText type="subtitle">Respondent Information</ThemedText>
                        <Controller control={control} rules={{ required: true, maxLength: 255 }}
                            render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                placeholder="ID or Passport Number"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                            )}
                            name="id_no"
                        />
                        {errors.id_no && <Text style={styles.errorText}>This field is required!</Text>}

                        <Controller control={control} rules={{ required: true, maxLength: 255 }}
                            render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                placeholder="Respondent First Name"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                            )}
                            name="fname"
                        />
                        {errors.fname && <Text>This is required.</Text>}
                        <Controller control={control} rules={{ required: true, maxLength: 255 }}
                            render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                placeholder="Respondent Surname"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                            )}
                            name="lname"
                        />
                        {errors.lname && <Text style={styles.errorText}>This field is required!</Text>}

                        <Controller control={control} rules={{ required: true, pattern: /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/ }}
                            render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                placeholder="yyyy-mm-dd"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                            )}
                            name="dob"
                        />
                        {errors.dob && <Text style={styles.errorText}>Please enter a valid date</Text>}
                        
                        
                        <Controller control={control} defaultValue="M" rules={{ required: true }}
                            render={({ field: { onChange, value } }) => (
                                <Picker onValueChange={onChange} selectedValue={value}>
                                    <Picker.Item label="Male" value="M" />
                                    <Picker.Item label="Female" value="F" />
                                    <Picker.Item label="Non-Binary" value="NB" />
                                </Picker>
                            )}
                            name="sex"
                        />
                        {errors.sex && <Text style={styles.errorText}>Please select an option!</Text>}

                        <Controller control={control} rules={{ required: true, maxLength: 255 }}
                            render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                placeholder="Ward"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                            )}
                            name="ward"
                        />
                        {errors.ward && <Text style={styles.errorText}>This field is required!</Text>}

                        <Controller control={control} rules={{ required: true, maxLength: 255 }}
                            render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                placeholder="Village"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                            )}
                            name="village"
                        />
                        {errors.village && <Text style={styles.errorText}>This field is required!</Text>}

                        <Controller control={control} rules={{ required: true, maxLength: 255 }}
                            render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                placeholder="District"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                            )}
                            name="district"
                        />
                        {errors.district && <Text style={styles.errorText}>This field is required!</Text>}

                        <Controller control={control} rules={{ required: true, maxLength: 255}}
                            render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                placeholder="Citizenship"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                            )}
                            name="citizenship"
                        />
                        {errors.citizenship && <Text style={styles.errorText}>This field is required!</Text>}

                        <Controller control={control} rules={{ maxLength: 255, pattern: /^\S+@\S+$/i  }}
                            render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                placeholder="email@website.com"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                            )}
                            name="email"
                        />
                        {errors.email && <Text style={styles.errorText}>Please enter a valid email address.</Text>}

                        <Controller control={control} rules={{ maxLength: 255, pattern: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/  }}
                            render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                placeholder="+267 71 234 567"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                            )}
                            name="contact_no"
                        />
                        {errors.contact_no && <Text style={styles.errorText}>Please enter a valid phone number</Text>}
                    </View>

                    <View>
                        <ThemedText type="subtitle">Questions</ThemedText>
                        {questions.map(question => (
                            <View key={question.id}>
                                <Question question={question} />
                            </View>
                        ))}
                    </View>
                <Button title="Submit" onPress={methods.handleSubmit(onSubmit)} />
            </ScrollView>
            </FormProvider>
        )
    }
}

const styles = StyleSheet.create({
    options: {
        flexDirection: 'row'
    },
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