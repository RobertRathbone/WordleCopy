import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Alert, ActivityIndicator  } from 'react-native';
import { colorsToEmoji, colors, CLEAR, ENTER } from '../../../constants';
import Keyboard from '../Keyboard';
import words from '../../../words';
import styles from './game.styles';
import { copyArray, getDayOfYear, getDayOfYearKey } from '../../../utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FinalPage from './FinalPage/FinalPage';
import Animated, {
  slideInDown, 
  SlideInLeft, 
  ZoomIn,
  FlipInEasyY
} from 'react-native-reanimated';


const NUMBER_OF_TRIES  = 6;

const dayOfTheYear = getDayOfYear();
const dayOfTheYearKey = getDayOfYearKey();
const dayKey = `day-${dayOfTheYearKey}`


const Game = () => {
  // AsyncStorage.removeItem('@game');
  const word = words[dayOfTheYear].toLowerCase();
  const letters = word.split("");

  const [rows, setRows] = useState(
    new Array(NUMBER_OF_TRIES).fill(new Array(letters.length).fill(''))
  ); // creates 2D array of empty boxes
  const [curRow, setCurRow] = useState(0);
  const [curCol, setCurCol] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (curRow >0){
      checkGameState();
    }
  }, [curRow]);

  useEffect(() => {
    if (loaded) {   
       persistState();
      }
  }, [rows, curRow, curCol, gameState]);

  useEffect(() => {
    readState();
  }, []);

const persistState = async () => {

  const dataForToday = {
    rows, curRow, curCol, gameState
  };
  try {
    const existingStateString = await AsyncStorage.getItem('@game');
    const existingState =  existingStateString ? JSON.parse(existingStateString) : {};

    existingState[dayKey] = dataForToday;
    const dataString = JSON.stringify(existingState);
    console.log('Saving', dataString);
    await AsyncStorage.setItem('@game', dataString);
  } catch (e) {
  console.log('Failed to write data to async storage', dayKey);
}};

const readState = async () => {
  const dataString = await AsyncStorage.getItem('@game');
  try {
    const data = JSON.parse(dataString);
    const day = data[dayKey];
    setRows(day.rows);
    setCurCol(day.curCol);
    setCurRow(day.curRow);
    setGameState(day.gameState);  
  } catch (e) {
    console.log('Could not parse the state');
  }
  setLoaded(true)
}

  const checkGameState = () => {
    if (checkIfWon() && gameState !== 'won') {
      setGameState('won');
    } else if (checkIfLost() &&gameState !== 'lost' ){
      setGameState('lost');
    }
  }

  const checkIfWon = () => {
    const row = rows[curRow - 1];
    return row.every((letter, i) => letter === letters[i])
  }

  const checkIfLost = () => {
    return !checkIfWon() && curRow ===rows.length;
  }

  const onKeyPressed = (key) => {
    if (gameState !== 'playing'){
      return;
    }
    const updatedRows = copyArray(rows);

    if (key === CLEAR){
      const prevCol = curCol - 1;
      if (prevCol >=0){
        updatedRows[curRow][prevCol] = '';
        setRows(updatedRows);
        setCurCol(prevCol);
      }
      return;
    }

    if (key === ENTER) {
      if (curCol === rows[0].length){
        setCurRow(curRow + 1);
        setCurCol(0);
        }
        return;
    }

    if (curCol <rows[0].length) {
      updatedRows[curRow][curCol] = key;
      setRows(updatedRows);
      setCurCol(curCol +1);
    }
  };

  const isCellActive = (row, col) => {
    return row === curRow && col === curCol;
  }

  const getCellBGColor = (row, col) => {
    const letter = rows[row][col];
    if (row >= curRow){
      return colors.black;
    }
    if (letter === letters[col]) {
      return colors.primary;
    }
    if (letters.includes(letter)){
      return colors.secondary;
    }
    return colors.darkgrey
  };

  const greenCaps = rows.flatMap((row, i) =>
    row.filter((cell, j) => getCellBGColor(i,j) === colors.primary)
  );
  const yellowCaps = rows.flatMap((row, i) =>
    row.filter((cell, j) => getCellBGColor(i,j) === colors.secondary)
  );
  const greyCaps = rows.flatMap((row, i) =>
    row.filter((cell, j) => getCellBGColor(i,j) === colors.darkgrey)
  );

  const getCellStyle = (i,j,) => ( [styles.cell, {borderColor: isCellActive(i,j)
    ? colors.grey
    : colors.darkgrey,
    backgroundColor: getCellBGColor(i, j),
    },
    ])

  if (!loaded){
    return (<ActivityIndicator />)
  }

  if (gameState != 'playing'){
    console.log("BurgerKing");
    return (<FinalPage won={gameState === 'won'} rows ={rows} getCellBGColor={getCellBGColor}/>)
  }

  return (
      <View style={styles.map}> 
        {rows.map((row, i) => 
          <Animated.View entering={SlideInLeft.delay(i*300)}
          key={`row-${i}`} 
          style ={styles.row}
          >
          {row.map((letter, j) => (
            <>
            {i < curRow && (
              < Animated.View entering={FlipInEasyY.delay(j*50)}  key={`cell-color-${i}-${j}`} style={getCellStyle(i,j)}>
                <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
              </Animated.View>
              )}
            {i === curRow && !!letter && (
              <Animated.View entering={ZoomIn.delay(i*30)} key={`cell-active-${i}-${j}`} style={getCellStyle(i,j)}>
                <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
              </Animated.View>
              )}
            {!letter && (
              < View key={`cell-${i}-${j}`} style={getCellStyle(i,j)}>
                <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
              </View>
              )}
            </>
          ))}
        </Animated.View>
        )}


      <Keyboard onKeyPressed={onKeyPressed} 
      greenCaps={greenCaps}
      yellowCaps={yellowCaps}
      greyCaps={greyCaps}
      />
    </View>
  );
}



export default Game;
