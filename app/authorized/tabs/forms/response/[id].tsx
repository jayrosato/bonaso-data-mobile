import { loadLocalByID, loadLocalFromArray } from '@/app/database/queryWriter';
import LoadingScreen from '@/components/LoadingScreen';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { useConnection } from '@/context/ConnectionContext';
import { storeResponseLocally } from '@/sync-load-queries/store-local-response';
import { syncResponses } from '@/sync-load-queries/sync-responses';
import theme from '@/themes/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
                    const isSelected = selected.some(s => s.id === option.id);
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
                                            name={selected.some(s => s.id === option.id) ? 'radio-button-on-outline' : 'radio-button-off-outline'}
                                            size={30}
                                            color={theme.colors.lightBackground}
                                        />
                                    </TouchableOpacity>
                                    <ThemedText>{option.text}</ThemedText>
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
                                            color={theme.colors.lightBackground}
                                        />
                                    </TouchableOpacity>
                                    <ThemedText>{option}</ThemedText>
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
                                    size={30}
                                    color={theme.colors.lightBackground}
                                />
                            </TouchableOpacity>
                            <ThemedText>{option.text}</ThemedText>
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
    const rules = question.logic?.[0]?.rules || []
    const operator = question.logic?.[0]?.conditional_operator || 'AND';

    const parentQuestions = useMemo(() => rules.map(rule => rule.parent_question.toString()), [rules]);
    const parentValues = useWatch({ control, name: parentQuestions })

    const [selected, setSelected] = useState(null)

    const show = useMemo(() => {
        const evaluateRule = (rule, val) =>{
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
                else if(val.some(v => v && typeof v === 'object' && v.id == expected)){
                    match = true
                }
                else if(val.length > 0 && expected === 'any'){
                    match = true
                }
            }
            else if(comparison === 'EQUAL TO'){
                if(!isNaN(val) && ! isNaN(expected)){
                    match = val === expected
                }
                else{
                    match = false
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
                if(!isNaN(val) && ! isNaN(expected)){
                    match = parseInt(val) > parseInt(expected) ? true : false
                }
                else{
                    match = false
                }
            }   
            else if(comparison === 'LESS THAN'){
                if(!isNaN(val) && ! isNaN(expected)){
                    match = parseInt(val) < parseInt(expected) ? true : false
                }
                else{
                    match = false
                }
            }

            return negate !== '0' ? !match : match
        };
        const results = rules.map((rule, index) => evaluateRule(rule, parentValues[index]));

        if (rules.some(rule => rule.limit_options)) {
            const valWithLimit = parentValues.find((val, idx) => rules[idx].limit_options);
            if (valWithLimit !== selected) {
                setSelected(valWithLimit); 
            }
        }

        return operator === 'AND' ? results.every(Boolean) : results.some(Boolean);
    }, [parentValues, rules, operator, selected]);

    useEffect(() => {
        const idx = rules.findIndex(rule => rule.limit_options);
        if(idx !== -1){
            const valWithLimit = parentValues[idx];
            if(valWithLimit !== selected){
                setSelected(valWithLimit);
            }
        }
    })
    if (!show) return null;
    
    if(question.type === 'Text'){
        return(
            <View style={styles.block}>
                <ThemedText type="subtitle" style={{ marginBottom: 15 }}>{question.text}</ThemedText>
                <Controller control={control} rules={{  }}
                    render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        placeholder="Type answer here..."
                        placeholderTextColor={theme.colors.lightGrey}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        style={styles.textInput}
                    />
                    )}
                    name={question.id.toString()}
                />
            </View>
        )
    }
    if(question.type === 'Number'){
        return(
            <View style={styles.block}>
                <ThemedText type="subtitle" style={{ marginBottom: 15 }}>{question.text}</ThemedText>
                <Controller control={control} rules={{ min:0, pattern: /^\d+$/ }}
                    render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        placeholder="Type any number here..."
                        placeholderTextColor={theme.colors.lightGrey}
                        onBlur={onBlur}
                        value={value}
                        onChangeText={(text) => {
                            const numericText = text.replace(/[^0-9]/g, '');
                            onChange(numericText);
                        }}
                        style={styles.textInput}
                    />
                    )}
                    name={question.id.toString()}
                />
            </View>
            
        )
    }
    if(question.type === 'Yes/No'){
        return(
            <View style={styles.block}>
                <ThemedText type="subtitle" style={{ marginBottom: 15 }}>{question.text}</ThemedText>
                <YNButtons question = {question} />
            </View>
        )
    }
    if(question.type === 'Single Selection'){
        return(
            <View style={styles.block}>
                <ThemedText type="subtitle" style={{ marginBottom: 15 }}>{question.text}</ThemedText>
                <RadioButtons question={question} />
            </View>
        )
    }
    if(question.type === 'Multiple Selections'){
        return(
            <View style={styles.block}>
                <ThemedText type="subtitle" style={{ marginBottom: 15 }}>{question.text}</ThemedText>
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
        console.log('Preparing to store response locally...', data);
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
    if(loading){ return <LoadingScreen /> }
    if (!form.questions || form.questions.length === 0) return <Text>This form has no questions.</Text>;
    if(form.questions.length > 0){
        const questions = form.questions
        return (
            <FormProvider {...methods}>
            <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <ThemedText type="title" style={{ marginBottom: 10,}}>New Response for {form.name}</ThemedText>
                    <ThemedText>{questions.length + 11} questions (max)</ThemedText>
                </View>

                <View style={styles.block}>
                    <ThemedText type="subtitle" style={{marginBottom: 20}}>Respondent Information</ThemedText>

                    <ThemedText>Respondent ID/Passport Number</ThemedText>
                    <Controller control={control} rules={{ required: true, maxLength: 255 }}
                        render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            placeholder="ID or Passport Number"
                            placeholderTextColor={theme.colors.lightGrey}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            style={styles.textInput}
                        />
                        )}
                        name="id_no"
                    />
                    {errors.id_no && <Text style={styles.errorText}>This field is required!</Text>}
                    
                    <ThemedText>Respondent First Name</ThemedText>
                    <Controller control={control} rules={{ required: true, maxLength: 255 }}
                        render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            placeholder="Respondent First Name"
                            placeholderTextColor={theme.colors.lightGrey}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            style={styles.textInput}
                        />
                        )}
                        name="fname"
                    />
                    {errors.fname && <Text>This is required.</Text>}

                    <ThemedText>Respondent Last Name</ThemedText>
                    <Controller control={control} rules={{ required: true, maxLength: 255 }}
                        render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            placeholder="Respondent Surname"
                            placeholderTextColor={theme.colors.lightGrey}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            style={styles.textInput}
                        />
                        )}
                        name="lname"
                    />
                    {errors.lname && <Text style={styles.errorText}>This field is required!</Text>}
                    
                    <ThemedText>Respondent Date of Birth</ThemedText>
                    <Controller control={control} rules={{ required: true, pattern: /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/ }}
                        render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            placeholder="yyyy-mm-dd"
                            placeholderTextColor={theme.colors.lightGrey}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            style={styles.textInput}
                        />
                        )}
                        name="dob"
                    />
                    {errors.dob && <Text style={styles.errorText}>Please enter a valid date</Text>}
                    
                    <ThemedText>Respondent Sex</ThemedText>
                    <Controller control={control} defaultValue="M" rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                            <Picker onValueChange={onChange} selectedValue={value} style={styles.picker}>
                                <Picker.Item label="Male" value="M" color={theme.colors.darkAccent} />
                                <Picker.Item label="Female" value="F" color={theme.colors.darkAccent} />
                                <Picker.Item label="Non-Binary" value="NB" color={theme.colors.darkAccent} />
                            </Picker>
                        )}
                        name="sex"
                    />
                    {errors.sex && <Text style={styles.errorText}>Please select an option!</Text>}
                    
                    <ThemedText>Respondent Ward</ThemedText>
                    <Controller control={control} rules={{ required: true, maxLength: 255 }}
                        render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            placeholder="Ward"
                            placeholderTextColor={theme.colors.lightGrey}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            style={styles.textInput}
                        />
                        )}
                        name="ward"
                    />
                    {errors.ward && <Text style={styles.errorText}>This field is required!</Text>}

                    <ThemedText>Respondent Village</ThemedText>
                    <Controller control={control} rules={{ required: true, maxLength: 255 }}
                        render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            placeholder="Village"
                            placeholderTextColor={theme.colors.lightGrey}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            style={styles.textInput}
                        />
                        )}
                        name="village"
                    />
                    {errors.village && <Text style={styles.errorText}>This field is required!</Text>}
                    
                    <ThemedText>Respondent District</ThemedText>
                    <Controller control={control} rules={{ required: true, maxLength: 255 }}
                        render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            placeholder="District"
                            placeholderTextColor={theme.colors.lightGrey}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            style={styles.textInput}
                        />
                        )}
                        name="district"
                    />
                    {errors.district && <Text style={styles.errorText}>This field is required!</Text>}
                    
                    <ThemedText>Respondent Citizenship</ThemedText>
                    <Controller control={control} rules={{ required: true, maxLength: 255}}
                        render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            placeholder="Citizenship"
                            placeholderTextColor={theme.colors.lightGrey}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            style={styles.textInput}
                        />
                        )}
                        name="citizenship"
                    />
                    {errors.citizenship && <Text style={styles.errorText}>This field is required!</Text>}
                    
                    <ThemedText>Respondent Email (Optional)</ThemedText>
                    <Controller control={control} rules={{ maxLength: 255, pattern: /^\S+@\S+$/i  }}
                        render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            placeholder="email@website.com"
                            placeholderTextColor={theme.colors.lightGrey}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            style={styles.textInput}
                        />
                        )}
                        name="email"
                    />
                    {errors.email && <Text style={styles.errorText}>Please enter a valid email address.</Text>}
                    
                    <ThemedText>Respondent Phone Number (Optional)</ThemedText>
                    <Controller control={control} rules={{ maxLength: 255, pattern: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/  }}
                        render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            placeholder="+267 71 234 567"
                            placeholderTextColor={theme.colors.lightGrey}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            style={styles.textInput}
                        />
                        )}
                        name="contact_no"
                    />
                    {errors.contact_no && <Text style={styles.errorText}>Please enter a valid phone number</Text>}
                </View>

                <View>
                    <ThemedText type="subtitle" style={{ marginBottom: 20 }}>Form Questions</ThemedText>

                    {questions.map(question => (
                        <View key={question.id}>
                            <Question question={question} />
                        </View>
                    ))}
                    {errors.fname && <Text>Please enter a number!.</Text>}
                </View>

                <ThemedButton text="Submit" onPress={methods.handleSubmit(onSubmit)} />
                <View style={{ height: 80} }></View>
            </ScrollView>
            </FormProvider>
        )
    }
}

const styles = StyleSheet.create({
    header:{
        marginBottom: 15,
    },
    options: {
        left:20,
        flexDirection: 'row',
        gap: 10,
    },
    block: {
        padding: 20,
        backgroundColor: theme.colors.darkAccent,
        borderRadius: 8,
        marginBottom: 20,
    },
    container: {
        padding: 20,
    },
    textInput: {
        marginTop: 10,
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 20,
        borderRadius: 8,
        padding: 12,
        color: theme.colors.lightText,
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
    },
    picker: {
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
        marginBottom: 20,
    },
});