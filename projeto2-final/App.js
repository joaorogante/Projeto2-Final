// App.js
import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Vibration,
  Image,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Importação das imagens
import HomeIcon from './assets/images/icons8-home-50.png';
import MenuIcon from './assets/images/menu_1477007.png';
import GraphIcon from './assets/images/graph_2364496.png';
import SettingsIcon from './assets/images/settings_841425.png';

// Contexto para gerenciamento de tarefas
const TaskContext = createContext();

const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [vibrationEnabled, setVibrationEnabled] = useState(true); // Estado para Vibração

  useEffect(() => {
    loadTasks();
    loadSettings();
  }, []);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  const saveTasks = async (newTasks) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
      setTasks(newTasks);
    } catch (error) {
      console.error('Erro ao salvar tarefas:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const storedVibration = await AsyncStorage.getItem('vibrationEnabled');
      if (storedVibration !== null) {
        setVibrationEnabled(JSON.parse(storedVibration));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('vibrationEnabled', JSON.stringify(vibrationEnabled));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  useEffect(() => {
    saveSettings();
  }, [vibrationEnabled]);

  const addTask = async (task) => {
    const newTask = {
      id: Math.random().toString(),
      ...task,
      createdAt: new Date().toISOString(),
      completed: false,
      category: task.category || 'geral',
    };
    const updatedTasks = [...tasks, newTask];
    await saveTasks(updatedTasks);
    if (vibrationEnabled) {
      Vibration.vibrate(400); // Vibra o celular ao adicionar uma tarefa
    }
  };

  const updateTask = async (taskId, updatedTask) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, ...updatedTask } : task
    );
    await saveTasks(updatedTasks);
  };

  const deleteTask = async (taskId) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    await saveTasks(updatedTasks);
  };

  const toggleTask = async (taskId) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    await saveTasks(updatedTasks);
    if (vibrationEnabled) {
      Vibration.vibrate(200); // Vibra o celular ao marcar/desmarcar uma tarefa
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        vibrationEnabled,
        setVibrationEnabled,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks deve ser usado dentro de um TaskProvider');
  }
  return context;
};

// Tela Principal (Home)
const HomeScreen = ({ navigation }) => {
  const { tasks, toggleTask, deleteTask } = useTasks();

  const handleEditTask = (task) => {
    navigation.navigate('EditTask', { task });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Todas as Tarefas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddTask')}
        >
          <Text style={{ color: 'white', fontSize: 24 }}>＋</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <TouchableOpacity
              onPress={() => toggleTask(item.id)}
              style={styles.taskCheckbox}
            >
              <Text style={{ fontSize: 24 }}>
                {item.completed ? '☑️' : '⬜️'}
              </Text>
            </TouchableOpacity>
            <View style={styles.taskContent}>
              <Text
                style={[styles.taskTitle, item.completed && styles.taskCompleted]}
              >
                {item.title}
              </Text>
              {item.category ? (
                <Text style={styles.taskCategory}>{item.category}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => handleEditTask(item)}
              style={styles.taskAction}
            >
              <Text style={{ fontSize: 20, color: '#666' }}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteTask(item.id)}
              style={styles.taskAction}
            >
              <Text style={{ fontSize: 20, color: '#ff6b6b' }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        style={styles.list}
      />
    </View>
  );
};

// Tela de Configurações com apenas o Switch de Vibração
const SettingsScreen = () => {
  const { vibrationEnabled, setVibrationEnabled } = useTasks();

  return (
    <View style={styles.screen}>
      <Text style={styles.headerTitle}>Configurações</Text>
      <View style={styles.settingsContainer}>
        {/* Switch de Vibração */}
        <View style={styles.settingItem}>
          <Text style={{ fontSize: 24, marginRight: 10 }}>📳</Text>
          <Text style={styles.settingLabel}>Vibração</Text>
          <Switch
            value={vibrationEnabled}
            onValueChange={(value) => setVibrationEnabled(value)}
          />
        </View>
      </View>
    </View>
  );
};

// Tela de Categorias
const CategoriesScreen = ({ navigation }) => {
  const { tasks } = useTasks();

  // Extrai categorias únicas
  const categories = [...new Set(tasks.map((task) => task.category))];

  const handleCategoryPress = (category) => {
    navigation.navigate('CategoryTasks', { category });
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.headerTitle}>Categorias</Text>
      <FlatList
        data={categories}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => handleCategoryPress(item)}
          >
            <Text style={styles.categoryTitle}>{item}</Text>
            <Text style={styles.categoryCount}>
              {tasks.filter((task) => task.category === item).length}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.list}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#666' }}>Nenhuma categoria encontrada.</Text>}
      />
    </View>
  );
};

// Tela de Estatísticas
const StatisticsScreen = () => {
  const { tasks } = useTasks();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  return (
    <View style={styles.screen}>
      <Text style={styles.headerTitle}>Estatísticas</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalTasks}</Text>
          <Text style={styles.statLabel}>Total de Tarefas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completedTasks}</Text>
          <Text style={styles.statLabel}>Tarefas Concluídas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{pendingTasks}</Text>
          <Text style={styles.statLabel}>Tarefas Pendentes</Text>
        </View>
      </View>
    </View>
  );
};

// Tela para Adicionar Tarefa
const AddTaskScreen = ({ navigation }) => {
  const { addTask } = useTasks();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = async () => {
    if (title.trim() === '') {
      alert('Por favor, insira um título para a tarefa.');
      return;
    }
    await addTask({ title, category });
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.headerTitle}>Adicionar Tarefa</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Título da Tarefa"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Categoria (opcional)"
          value={category}
          onChangeText={setCategory}
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Adicionar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Tela para Editar Tarefa
const EditTaskScreen = ({ route, navigation }) => {
  const { task } = route.params;
  const { updateTask } = useTasks();
  const [title, setTitle] = useState(task.title);
  const [category, setCategory] = useState(task.category);

  const handleSubmit = async () => {
    if (title.trim() === '') {
      alert('Por favor, insira um título para a tarefa.');
      return;
    }
    await updateTask(task.id, { title, category });
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.headerTitle}>Editar Tarefa</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Título da Tarefa"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Categoria (opcional)"
          value={category}
          onChangeText={setCategory}
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Salvar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Tela para Mostrar Tarefas por Categoria
const CategoryTasksScreen = ({ route, navigation }) => {
  const { category } = route.params;
  const { tasks, toggleTask, deleteTask } = useTasks();

  const filteredTasks = tasks.filter((task) => task.category === category);

  const handleEditTask = (task) => {
    navigation.navigate('EditTask', { task });
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.headerTitle}>Categoria: {category}</Text>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <TouchableOpacity
              onPress={() => toggleTask(item.id)}
              style={styles.taskCheckbox}
            >
              <Text style={{ fontSize: 24 }}>
                {item.completed ? '☑️' : '⬜️'}
              </Text>
            </TouchableOpacity>
            <View style={styles.taskContent}>
              <Text
                style={[styles.taskTitle, item.completed && styles.taskCompleted]}
              >
                {item.title}
              </Text>
              {item.category ? (
                <Text style={styles.taskCategory}>{item.category}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => handleEditTask(item)}
              style={styles.taskAction}
            >
              <Text style={{ fontSize: 20, color: '#666' }}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteTask(item.id)}
              style={styles.taskAction}
            >
              <Text style={{ fontSize: 20, color: '#ff6b6b' }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        style={styles.list}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#666' }}>Nenhuma tarefa encontrada nesta categoria.</Text>}
      />
    </View>
  );
};

// Navegação por Abas
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconSource;

          if (route.name === 'Home') {
            iconSource = HomeIcon;
          } else if (route.name === 'Categories') {
            iconSource = MenuIcon;
          } else if (route.name === 'Statistics') {
            iconSource = GraphIcon;
          } else if (route.name === 'Settings') {
            iconSource = SettingsIcon;
          }

          return (
            <Image
              source={iconSource}
              style={{ width: size, height: size, tintColor: color }}
            />
          );
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // Garantir que o header não apareça nas abas
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

const App = () => {
  return (
    <TaskProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddTask"
            component={AddTaskScreen}
            options={{
              headerTitle: '',
            }}
          />
          <Stack.Screen
            name="EditTask"
            component={EditTaskScreen}
            options={{
              headerTitle: '',
            }}
          />
          <Stack.Screen
            name="CategoryTasks"
            component={CategoryTasksScreen}
            options={{
              headerTitle: '',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </TaskProvider>
  );
};

// Estilos
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  taskCheckbox: {
    marginRight: 10,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  taskCategory: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 2,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  taskAction: {
    padding: 5,
    marginLeft: 5,
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  statItem: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  settingsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 2,
    marginTop: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1, // Para que o switch fique alinhado à direita
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 'auto',
  },
});

export default App;

