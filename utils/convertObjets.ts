const changeKeyObjects = (arr, replaceKeys) => {
    return arr.map(item => {
      const newItem = {};
      Object.keys(item).forEach(key => {
        newItem[replaceKeys[key]] = item[key];
      });
      return newItem;
    });
  };


  export {changeKeyObjects}