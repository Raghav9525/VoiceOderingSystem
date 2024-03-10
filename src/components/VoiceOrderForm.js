
import React, { useEffect, useState } from 'react';
import { TiDelete } from "react-icons/ti";
import { MdDelete } from "react-icons/md";
import { wordToNumber } from './constant'
import { FaMicrophone } from "react-icons/fa6";



function VoiceOrderForm() {
    const [orderDetails, setOrderDetails] = useState([{ id: 0, productName: '', productCount: '' }]);
    const [index, setIndex] = useState(0);
    const [voice, setVoice] = useState('')
    const [products, setProducts] = useState(['samosa', 'burger', 'pizza'])
    const [quantity, setQuantity] = useState(['ek', 'do', 'tin', 'char', 'pach', 'one', 'two', 'three', 'four', 'five'])

    // voice input handling code below

    //function for recoding voice and convet into sentence
    async function startSpeechRecognition() {
        return new Promise((resolve, reject) => {
            // Check if browser supports SpeechRecognition
            if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {

                let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                let recognition = new SpeechRecognition();

                // Set recognition parameters
                recognition.continuous = false; // Stop listening after first speech input
                recognition.lang = 'en-US'; // Set language

                // Define event handlers
                recognition.onresult = function (event) {

                    let transcriptResult = event.results[0][0].transcript;
                    console.log('You said: ' + transcriptResult);
                    setVoice(transcriptResult); // Update the state with the transcript
                    resolve(transcriptResult); // Reso
                };

                recognition.onerror = function (event) {
                    console.error('Speech recognition error:', event.error);
                    reject(event.error); // Reject the promise with error
                };

                recognition.start();
            } else {
                reject(new Error('Speech recognition not supported'));
            }
        });
    }

    // finding min distance to convert 1 word to other.
    function levenshteinDistance(word1, word2) {
        const m = word1.length;
        const n = word2.length;
        const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) {
            for (let j = 0; j <= n; j++) {
                if (i === 0) {
                    dp[i][j] = j;
                } else if (j === 0) {
                    dp[i][j] = i;
                } else if (word1[i - 1] === word2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
                }
            }
        }

        return dp[m][n];
    }

    //pass input_word and each product or quantity item as wordList 
    function findMostSimilarWord(word1, WordList) {

        for (let i = 0; i < WordList.length; i++) {
            let word2 = WordList[i];
            let threshold;

            const distance = levenshteinDistance(word1, word2.toLowerCase());

            if (word1.length > word2.length) {
                threshold = Math.floor(word1.length / 2);
            }
            else {
                threshold = Math.floor(word2.length / 2)
            }

            if (distance <= threshold) {
                return word2;
            }
        }
    }

    //finding similar word for quantity
    async function getQuantity(voice) {
        const inputWords = voice.split(" ");
        let quantity_array = [];

        for (let i = 0; i < inputWords.length; i++) {
            let word = inputWords[i];
            if (!isNaN(word)) {
                quantity_array.push(parseInt(word, 10));
            } else {
                const matchedQuantity = await findMostSimilarWord(word, quantity);
                if (matchedQuantity !== undefined) {
                    quantity_array.push(matchedQuantity);
                }
            }
        }

        // Assuming wordToNumber is available in the scope
        quantity_array = quantity_array.map(item => {
            if (isNaN(item)) {
                const number = wordToNumber[item];
                return number === undefined ? 0 : number;
            } else {
                return item;
            }
        });

        return quantity_array;
    }

    //finding similar words for product.
    async function printSimilarWords(voice) {
        const inputWords = voice.toLowerCase().split(" ");
        const mostSimilarWord = [];

        for (let i = 0; i < inputWords.length; i++) {
            const matchWord = await findMostSimilarWord(inputWords[i], products);
            if (matchWord !== undefined) {
                mostSimilarWord.push(matchWord);
            }
        }
        return mostSimilarWord;
    }

    function updateVoiceOrder(mostSimilarWords, inputQuantity) {
        let newOrderDetails = [...orderDetails];
        let newId = index;
        // const iterations = Math.min(mostSimilarWords.length, inputQuantity.length);

        mostSimilarWords.forEach((word, idx) => {
            const quantity = inputQuantity[idx];
            let existingEmptyIndex = newOrderDetails.findIndex(detail => detail.productName === '' && detail.productCount === '');

            if (existingEmptyIndex !== -1) {
                // If there's an existing empty row, update it
                newOrderDetails[existingEmptyIndex] = { ...newOrderDetails[existingEmptyIndex], productName: word, productCount: quantity };
            } else {
                // Otherwise, insert a new row at the start
                newOrderDetails = [{ id: newId + 1, productName: word, productCount: quantity }, ...newOrderDetails];
                newId++; // Increment newId since we're adding a new row
            }
        });

        // Check if the last operation added a new row, if not, add an empty one for future input
        if (mostSimilarWords.length > 0 || inputQuantity.length > 0) {
            newOrderDetails = [{ id: newId + 1, productName: '', productCount: '' }, ...newOrderDetails];
            newId++;
        }
        setOrderDetails(newOrderDetails);
        setIndex(newId);

    }

    useEffect(() => {
        console.log(orderDetails)
    }, [orderDetails])


    async function voiceOrder() {
        try {
            // const utterance = new SpeechSynthesisUtterance("apko kya order karna hai");
            const utterance = new SpeechSynthesisUtterance("what you like to place an order for");

            window.speechSynthesis.speak(utterance);
            const transcriptResult = await startSpeechRecognition();
            // const transcriptResult = '2 samosa tin pizza'
            const mostSimilarWords = await printSimilarWords(transcriptResult);
            const inputQuantity = await getQuantity(transcriptResult);
            updateVoiceOrder(mostSimilarWords, inputQuantity);
        } catch (error) {
            console.error('Error with speech recognition:', error);
        }
    }


    const handleInputChange = (index, field, value) => {
        const newOrderDetails = [...orderDetails];
        const orderIndex = newOrderDetails.findIndex(order => order.id === index);
        newOrderDetails[orderIndex][field] = value;
        setOrderDetails(newOrderDetails);
    };

    const handleAddRow = (e) => {
        e.preventDefault();
        const newId = index + 1;
        setOrderDetails([{ id: newId, productName: '', productCount: '' }, ...orderDetails]);
        setIndex(newId);
    };

    const handleDeleteRow = (id) => {
        setOrderDetails(orderDetails.filter(order => order.id !== id));
    };

    // form creation and funtion code below
    const cardStyle = {
        boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset',
    };

    return (
        <div style={{ backgroundColor: "#1d2b53", minHeight: "100vh" }}>
            <div className="container" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div className="row">
                    <div className="col-md-3"></div>
                    <div className="col-12 col-md-6 mt-4 mb-4">
                        <div className="card p-4 shadow-lg border-danger" style={cardStyle}>

                            <div className='mb-2' style={{ display: 'flex', alignItems: 'center' }}>
                                <h3 style={{ margin: '0' }}>Press Mic</h3>
                                <button className="mb-2 bg-white" style={{ border: 'none', marginLeft: '20px' }} onClick={voiceOrder}>
                                    <FaMicrophone style={{ color: "red", fontSize: "30px" }} />
                                </button>
                            </div>

                            <form onSubmit={(e) => e.preventDefault()}>

                                {orderDetails.map((order, orderIndex) => (
                                    <div key={order.id} className="row mb-3">
                                        <div className="col-5 col-md-5">
                                            <select
                                                className="form-select"
                                                value={order.productName}
                                                onChange={(e) => handleInputChange(order.id, 'productName', e.target.value)}
                                            >
                                                <option value="">Select Product</option>
                                                <option value="samosa">Samosa</option>
                                                <option value="pizza">Pizza</option>
                                                <option value="burger">Burger</option>

                                            </select>
                                        </div>
                                        <div className="col-5 col-md-5">
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={order.productCount}
                                                onChange={(e) => handleInputChange(order.id, 'productCount', e.target.value)}
                                                placeholder="Product Count"
                                            />
                                        </div>
                                        <div className="col-2 col-md-2">
                                            {orderIndex === 0 && (
                                                <button className="btn btn-primary" onClick={handleAddRow}>Add</button>
                                            )}
                                            {orderIndex !== 0 && (
                                                <button className="btn mt-0" onClick={() => handleDeleteRow(order.id)}><MdDelete style={{ fontSize: "35px", color: "red" }} /></button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button type="button" className="btn btn-success mt-3" onClick={() => console.log(orderDetails)}>Submit</button>
                            </form>
                        </div>
                    </div>
                    <div className="col-md-3"></div>
                </div>
            </div>
        </div>
    );
}

export default VoiceOrderForm;
