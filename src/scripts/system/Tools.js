export class Tools{
    static randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    static isSubArray(mainArray, subArray) {
        return mainArray.every(value => subArray.includes(value));
    }
    static massiveRequire(require) {
        const files = [];
        require.keys().forEach((key) => {
            files.push({
                key, data: require(key)
            });
        });
        return files;
     }
}