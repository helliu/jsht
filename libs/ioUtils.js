var path = require('path');
const fs = require('fs');

class IoUtils{
    saveFullPath(filePath, fileContent){
        let dirPath = path.dirname(filePath);

        if(!fs.existsSync(dirPath))
            fs.mkdirSync(dirPath, { recursive: true });

        fs.writeFileSync(filePath, fileContent);
    }
}


let ioUtils = new IoUtils();
module.exports = ioUtils;