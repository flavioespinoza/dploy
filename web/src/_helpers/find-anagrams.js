function findAnagrams(dictionary, query) {
  const result = [];
  const dictMap = preprocessDictionary(dictionary);

  for (const q of query) {
    const sortedQuery = q.split('').sort().join('');
    if (dictMap.has(sortedQuery)) {
      result.push(dictMap.get(sortedQuery).length);
    } else {
      result.push(0);
    }
  }

  return result;
}

function preprocessDictionary(dictionary) {
  const dictMap = new Map();
  for (const word of dictionary) {
    const sortedWord = word.split('').sort().join('');
    if (!dictMap.has(sortedWord)) {
      dictMap.set(sortedWord, []);
    }
    dictMap.get(sortedWord).push(word);
  }
  return dictMap;
}

// Example usage:
const dictionary = ['heater', 'cold', 'clod', 'reheat', 'docl'];
const query = ['codl', 'heater', 'abcd'];

const anagrams = findAnagrams(dictionary, query);
console.log(anagrams);
