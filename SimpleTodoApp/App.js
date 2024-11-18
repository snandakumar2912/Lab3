import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const savedTasks = await AsyncStorage.getItem('tasks');
        if (savedTasks) {
          setTasks(JSON.parse(savedTasks));
        }
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    };
    loadTasks();
  }, []);

  useEffect(() => {
    const saveTasks = async () => {
      try {
        await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
      } catch (error) {
        console.error('Failed to save tasks:', error);
      }
    };
    saveTasks();
  }, [tasks]);

  const addOrUpdateTask = () => {
    if (task.trim()) {
      if (isEditing) {
        setTasks(tasks.map((item) =>
          item.id === editTaskId ? { ...item, text: task } : item
        ));
        setIsEditing(false);
        setEditTaskId(null);
      } else {
        setTasks([...tasks, { id: Date.now().toString(), text: task, completed: false }]);
      }
      setTask('');
    }
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter((item) => item.id !== taskId));
  };

  const toggleTaskCompletion = (taskId) => {
    setTasks(tasks.map((item) =>
      item.id === taskId ? { ...item, completed: !item.completed } : item
    ));
  };

  const startEditingTask = (taskId, taskText) => {
    setIsEditing(true);
    setEditTaskId(taskId);
    setTask(taskText);
  };

  const TaskItem = ({ item }) => {
    const opacity = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const backgroundColor = useRef(
      new Animated.Value(isEditing && item.id === editTaskId ? 1 : 0)
    ).current;

    const handleDelete = () => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 300, 
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => deleteTask(item.id));
    };

    const taskBackgroundColor = backgroundColor.interpolate({
      inputRange: [0, 1],
      outputRange: ['#fff', '#d4edda'], 
    });

    useEffect(() => {
      if (isEditing && item.id === editTaskId) {
        Animated.timing(backgroundColor, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }).start();
      } else {
        Animated.timing(backgroundColor, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }).start();
      }
    }, [isEditing, editTaskId]);

    return (
      <Animated.View
        style={[
          styles.taskContainer,
          {
            opacity,
            transform: [{ translateX }],
            backgroundColor: taskBackgroundColor,
          },
        ]}
      >
        <TouchableOpacity onPress={() => toggleTaskCompletion(item.id)}>
          <Text
            style={[
              styles.taskText,
              item.completed && styles.completedTaskText,
            ]}
          >
            {item.text}
          </Text>
        </TouchableOpacity>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={() => startEditingTask(item.id, item.text)}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={styles.deleteButton}>X</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple To-Do List</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add or edit a task"
          value={task}
          onChangeText={(text) => setTask(text)}
        />
        <TouchableOpacity style={styles.addButton} onPress={addOrUpdateTask}>
          <Text style={styles.addButtonText}>{isEditing ? '✔' : '+'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        renderItem={({ item }) => <TaskItem item={item} />}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: '#5C5CFF',
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginLeft: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  taskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#333',
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    color: '#5C5CFF',
    marginRight: 10,
  },
  deleteButton: {
    color: '#FF5C5C',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
