function plusMinus(arr) {
  const length = arr.length;
  let positiveCount = 0;
  let negativeCount = 0;
  let zeroCount = 0;

  for (let i = 0; i < arr.length; i++) {
      if (arr[i] > 0) {
          positiveCount++;
      } else if (arr[i] < 0) {
          negativeCount++;
      } else {
          zeroCount++;
      }
  }
  
  console.log((positiveCount / length).toFixed(6));
  console.log((negativeCount / length).toFixed(6));
  console.log((zeroCount / length).toFixed(6));

}


let example = [-4, 3, -9, 0, 4, 1];
console.log(plusMinus(example));