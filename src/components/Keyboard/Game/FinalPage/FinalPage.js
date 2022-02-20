import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { colors, colorsToEmoji } from "../../../../constants";
import * as Clipboard  from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
    slideInDown, 
    SlideInLeft, 
    ZoomIn,
    FlipInEasyY
  } from 'react-native-reanimated';

const Number = ({number, label}) => (
    <View style={{ alignItems: 'center', margin: 10 }}>
        <Text style={{ color: colors.lightgrey, fontSize: 30, fontWeight: 'bold' }}>{number}</Text>
        <Text style={{ color: colors.lightgrey, fontSize: 16, }}>{label}</Text>
    </View>
);

const GuessDistributionLine = ({position, amount, percentage}) => {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
            <Text style={{ color: colors.lightgrey}}>{position}</Text>
        <View style={{ alignSelf: 'stretch', backgroundColor: colors.grey, margin: 5, padding: 5, minWidth: 20,
         width: `${percentage}%` }}>
            <Text style={{ color: colors.lightgrey}}>{amount}</Text>
        </View>
        </View>
    );
};

const GuessDistribution =({distribution}) => {
    if (!distribution){

        return null;
    }
    const sum = distribution.reduce((total, dist) => dist + total, 0);
    return (
    <>
    <Text style={styles.subtitle}>Guess Distribution</Text>
    <View style={{ width: '100%', padding: 20, alignSelf: 'stretch' }}>
        {distribution.map((dist, index) => (
            <GuessDistributionLine 
            key={index}
            position={index + 1} 
            amount ={dist} 
            percentage={(100 * dist) / sum}
            />
        ))}
    </View>
    </>
    );
};

const FinalPage = ({ won = false, rows, getCellBGColor}) => {
    const [secondsTilTomorrow, setSecondsTilTomorrow] = useState();
    const [played, setPlayed] = useState(0);
    const [winRate, setWinRate] = useState(0);
    const [curStreak, setCurStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [distribution, setDistribution] = useState(null);

    const share = () => {
        const textMap = rows.map((row,i) =>
        row.map((cell, j) => colorsToEmoji[getCellBGColor(i,j)] ).join('')
        ).filter((row) => row)
        .join('\n');
        const textToShare = `Wordle Copy \n ${textMap}`;
        Clipboard.setString(textToShare)
        Alert.alert('Copied to your clipboard', 'Paste to share to social media')
      }

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

            setSecondsTilTomorrow(( tomorrow - now) /1000 );
        }; 
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        readState();
      }, []);

    const readState = async () => {
        const dataString = await AsyncStorage.getItem('@game');
        var data;
        try {
          const data = JSON.parse(dataString);
          console.log(data)
          const keys = Object.keys(data);
          const values = Object.values(data);



        setPlayed(keys.length);

        const numberOfWins = values.filter(game => game.gameState === 'won').length;
        setWinRate(Math.floor(100*numberOfWins/keys.length));

        let _curStreak = 0;
        let _maxStreak = 0;
        let prevDay = 0;
        keys.forEach((key) => {
            const day = parseInt(key.split('-')[1]);
            if (data[key].gameStet === 'won' && _curStreak === 0){
                _curStreak +=1;
            }
            else if (data[key].gameState === 'won' && prevDay + 1 === day) {
                _curStreak += 1;
            } else {
                if (_curStreak > _maxStreak){
                    _maxStreak = _curStreak
                }
                _curStreak = data[key].gameState === 'won' ? 1: 0;
            }
            prevDay = day;
        });
        setMaxStreak(_maxStreak)
        setCurStreak(_curStreak);
        console.log("Dude", _curStreak);
        
      

      // guess distribution
      const dist = [0,0,0,0,0,0];
      values.map((game) => {
          if (game.gameState === 'won'){
              const tries = game.rows.filter((row) => row[0]).length;
              dist[tries] = dist[tries] + 1;
          }
      });
      console.log("dist", dist);
      setDistribution(dist);

    } catch (e) {
        console.log('Could not parse the state');
    }
    };

    const formatSeconds = () => {
        const hours = Math.floor(secondsTilTomorrow / (60*60));
        const minutes = Math.floor((secondsTilTomorrow % (60 * 60))/ 60);
        const seconds = Math.floor(secondsTilTomorrow % 60);
        
    return `${hours}:${minutes}:${seconds}`;
    };

    return (
        <View style={{ alignItems: 'center' }}>
            <Animated.Text entering={SlideInLeft} style={styles.title}>
                {won ? 'Congrats' : 'Try again tomorrow'}
            </Animated.Text>
            <Animated.View entering={SlideInLeft.delay(300).springify()}>
                <Text style={styles.subtitle}>Statistics</Text>
                <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                    <Number number ={played} label={'Played'} />
                    <Number number ={winRate} label={'Win %'} />
                    <Number number ={curStreak} label={'Cur Streak'} />
                    <Number number ={maxStreak} label={'Max Streak'} />
                </View>
            </Animated.View>

            
            <GuessDistribution distribution={distribution} />
            <View style={{flexDirection: 'row' }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ color: colors.lightgrey}}>Next Wordle Here</Text>
                    <Text style={{ color: colors.lightgrey, fontSize: 24, fontWeight: 'bold' }}>{formatSeconds()}</Text>
                </View>

                <Pressable onPress={share} style={{ flex: 1, backgroundColor: colors.primary,
                     borderRadius: 25, alignItems: 'center',  justifyContent: 'center' }}>
                    <Text style={{ color: colors.lightgrey, fontWeight: 'bold' }}>Share</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: 30,
        color: 'white',
        marginVertical: 20,
    },
    subtitle: {
        fontSize: 20,
        color: colors.lightgrey,
        textAlign: 'center',
        marginVertical: 15,
        fontWeight: 'bold',
    }
})

export default FinalPage;