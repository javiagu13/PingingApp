import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Modal, ToastAndroid} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NavigationContainer, useNavigation, useIsFocused } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';


const Stack = createNativeStackNavigator();

const showToast = (text) => {
  ToastAndroid.show(text, ToastAndroid.SHORT);
};

const getUniqueID = () => {
  return Math.random().toString(36).substr(2, 9);
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const [people, setPeople] = useState([]);

  useEffect(() => {
    const loadPeople = async () => {
      try {
        const peopleData = await AsyncStorage.getItem('people');
        if (peopleData) {
          setPeople(JSON.parse(peopleData));
        }
        else{
          showToast("Good job, your network is healthy!");
        }
      } catch (error) {
        console.log('Error loading people:', error);
      }
    };

    loadPeople();
  }, []);

  const reloadPeople = async () => {
    try {
      const peopleData = await AsyncStorage.getItem('people');
      if (peopleData) {
        setPeople(JSON.parse(peopleData));
      }
    } catch (error) {
      console.log('Error loading people:', error);
    }
  };

  useEffect(() => {
    reloadPeople();
  }, []);

  
  const handleContacted = (index) => {
    const updatedPeople = [...people];
    const now = Date.now();
    updatedPeople[index].lastContacted = now; // Update the last contacted time
    setPeople(updatedPeople);
    AsyncStorage.setItem('people', JSON.stringify(updatedPeople))
      .catch(error => {
        console.log('Error saving people:', error);
      }); 
  };

  const renderItem = ({ item, index }) => {
    if (!item.lastContacted || shouldAppear(item.lastContacted, item.period, item.periodUnit)) {
      return (
        <View style={styles.item}>
          <Text>{item.name}</Text>
          <Button title="Contacted" onPress={() => handleContacted(index)} />
        </View>
      );
    }
    return null;
  }; 

  const shouldAppear = (lastContacted, period, periodUnit) => {
    const timeSinceContacted = Date.now() - lastContacted;
    const periodInMilliseconds = calculatePeriodInMilliseconds(period, periodUnit);

    return timeSinceContacted >= periodInMilliseconds;
  };

  const calculatePeriodInMilliseconds = (period, periodUnit) => {
    let multiplier = 1;
    if (periodUnit === 'minutes') {
      multiplier = 60 * 1000; // Convert to milliseconds
    } else if (periodUnit === 'hours') {
      multiplier = 60 * 60 * 1000; // Convert to milliseconds
    } else if (periodUnit === 'days') {
      multiplier = 24 * 60 * 60 * 1000; // Convert to milliseconds
    }
    return period * multiplier;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={people.filter(person => !person.contacted)}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>You are up to date!</Text>}
      />
      <View style={styles.buttonContainerMain}>
        <Button
          title="Add Person"
          onPress={() => navigation.navigate('List')} color='black' 
        />
      </View>
    </View>
  );
};

const ListScreen = () => {
  const [people, setPeople] = useState([]);
  const [name, setName] = useState('');
  const [period, setPeriod] = useState(''); 
  const [periodUnit, setPeriodUnit] = useState('days');
  const [country, setCountry] = useState('Spain');
  const [selectedCountry, setSelectedCountry] = useState('Spain'); 
  const [modalVisible, setModalVisible] = useState(false);
  const [newCountry, setNewCountry] = useState('');
  const [countryOptions, setCountryOptions] = useState(['Spain', 'Korea']);

  useEffect(() => {
    const loadCountryOptions = async () => {
      try {
        const savedCountryOptions = await AsyncStorage.getItem('countryOptions');
        if (savedCountryOptions) {
          setCountryOptions(JSON.parse(savedCountryOptions));
        }
      } catch (error) {
        console.log('Error loading country options:', error);
      }
    };
  
    loadCountryOptions();
  }, []);

  useEffect(() => {
    const loadPeople = async () => {
      try {
        const peopleData = await AsyncStorage.getItem('people'); 
        if (peopleData) {
          setPeople(JSON.parse(peopleData));
        }
      } catch (error) {
        console.log('Error loading people:', error);
      }
    };   

    loadPeople();
  }, []);

  useEffect(() => {
    const saveCountryOptions = async () => {
      try {
        await AsyncStorage.setItem('countryOptions', JSON.stringify(countryOptions));
      } catch (error) {
        console.log('Error saving country options:', error);
      }
    };

    saveCountryOptions();
  }, [countryOptions]);

  const addPerson = async () => {
    if (name && period && periodUnit && country) {
      const newPerson = {
        id: getUniqueID(), // Add a unique ID
        name,
        period,
        periodUnit,
        country,
        contacted: false,
        lastContacted: null // Initialize lastContacted to null
      };
      const updatedPeople = [...people, newPerson];
      setPeople(updatedPeople);
      setName('');
      setPeriod('');
      setPeriodUnit('');
      setCountry('');
      try {
        await AsyncStorage.setItem('people', JSON.stringify(updatedPeople));
      } catch (error) {
        console.log('Error saving people:', error);
      }
    }
  };

  const editPerson = (index, newPeriod, newPeriodUnit) => {
    const updatedPeople = [...people];
    updatedPeople[index].period = newPeriod;
    updatedPeople[index].periodUnit = newPeriodUnit;
    setPeople(updatedPeople);
    AsyncStorage.setItem('people', JSON.stringify(updatedPeople)).catch(error => {
      console.log('Error saving people:', error);
    });
  };

  const deletePerson = (id) => {
    const updatedPeople = people.filter(person => person.id !== id);
    setPeople(updatedPeople);
    AsyncStorage.setItem('people', JSON.stringify(updatedPeople))
      .catch(error => {
        console.log('Error saving people:', error);
      });
  };
  
  

  const filterPeople = () => {
    if (selectedCountry === '') {
      return people;
    } else {
      return people.filter(person => person.country === selectedCountry);
    }
  };

  const renderCountryOptions = () => {
    return countryOptions.map(country => (
      <Picker.Item key={country} label={country} value={country} />
    ));
  };

  const handleCountrySelection = (value) => {
    if (value === 'Add New Country') {
      setModalVisible(true);
    } else {
      setCountry(value);
    }
  };

  const handleAddCountry = () => {
    if (newCountry) {
      const updatedCountryOptions = [...countryOptions, newCountry];
      setCountryOptions(updatedCountryOptions);
      setCountry(newCountry);
      setModalVisible(false);
      setNewCountry('');

      try {
        AsyncStorage.setItem('countryOptions', JSON.stringify(updatedCountryOptions));
      } catch (error) {
        console.log('Error saving country options:', error);
      }
    }
  };  

  const handleRemoveCountry = () => {
    if (newCountry) {
      const updatedCountryOptions = [...countryOptions];
      const countryIndex = updatedCountryOptions.indexOf(newCountry);
      if (countryIndex !== -1) {
        updatedCountryOptions.splice(countryIndex, 1);
        setCountryOptions(updatedCountryOptions);
        setNewCountry('');

        try {
          AsyncStorage.setItem('countryOptions', JSON.stringify(updatedCountryOptions));
        } catch (error) {
          console.log('Error saving country options:', error);
        }
      }
    }
  }; 


  const renderItem = ({ item, index }) => (
    <View style={styles.item}>
      <Text>{item.name}</Text>
      <TextInput
        style={styles.input}
        value={item.period.toString()}
        placeholder="Period"
        keyboardType="numeric"
        onChangeText={text => editPerson(index, text, item.periodUnit)}
      />
      <Picker
        selectedValue={item.periodUnit}
        style={styles.picker2}
        onValueChange={value => editPerson(index, item.period, value)}
      >
        <Picker.Item label="Days" value="days" />
        <Picker.Item label="Hours" value="hours" /> 
        <Picker.Item label="Minutes" value="minutes" />        
      </Picker>
      <Button title="Delete" onPress={() => deletePerson(item.id)} color='black'/>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.addContainer}>
        <TextInput
          style={styles.input}
          value={name}
          placeholder="Name"
          onChangeText={text => setName(text)}
        />
       <TextInput
          style={styles.input}
          value={period}
          placeholder="Period"
          keyboardType="numeric"
          onChangeText={text => setPeriod(text)}
        />
        <Picker
          selectedValue={periodUnit}
          style={styles.picker0}
          onValueChange={value => setPeriodUnit(value)}
        >
          <Picker.Item label="Days" value="days" />
          <Picker.Item label="Hours" value="hours" />
          <Picker.Item label="Minutes" value="minutes" />
                    
        </Picker>
        <Picker
          selectedValue={country}
          style={styles.picker}
          onValueChange={handleCountrySelection}
        >
          {renderCountryOptions()}
          <Picker.Item label="Add New Country" value="Add New Country" />
        </Picker>
        <Button title="Add Person" onPress={addPerson} color='black' />
      </View>
      <View style={styles.filterContainer}>
        <Picker
          selectedValue={selectedCountry}
          style={styles.picker}
          onValueChange={value => setSelectedCountry(value)}
        >
          {renderCountryOptions()}
        </Picker>
      </View>
      <FlatList
        data={filterPeople()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()} // Use the unique ID as the key
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text>No people found</Text>}
      />
      <View style={styles.buttonContainerMain}>
      <Button title="Save Changes"
        onPress={() => {
          AsyncStorage.setItem('people', JSON.stringify(people))
            .catch(error => {
              console.log('Error saving people:', error);
            });
        }} color='black'/>
      </View>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.input}
            value={newCountry}
            placeholder="New Country"
            onChangeText={text => setNewCountry(text)}
          />
          <Button title="Add" onPress={handleAddCountry} color='black' />
          <Button title="Remove" onPress={handleRemoveCountry} color='black' />
          <Button title="Cancel" onPress={() => setModalVisible(false)} color='black' />
        </View>
      </Modal>
    </View>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}          
          options={{ title: 'Reminders' }}
        />
        <Stack.Screen
          name="List"
          component={ListScreen}
          options={{ title: 'Add Person' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};



const styles = StyleSheet.create({

  container: {
    flex: 1,
    paddingTop: 30,
    paddingHorizontal: 16,
  },
  addContainer: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  picker0: {
    height: 40,
    marginBottom: 0,
  },
  picker: {
    height: 40,
    marginBottom: 10,
  },
  picker2: {
    height: 40,
    width: 120,
    marginBottom: 10,
  },
  listContainer: {
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
    emptyText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  buttonContainer: {
    marginTop: 30,
  },
  buttonContainerMain: {
    marginTop: 30,
    marginBottom:25,
  },
});

export default App;
