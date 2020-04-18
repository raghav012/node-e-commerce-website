const fs = require('fs');
//TRHIS IS CREATED TO DELETE THE IMAGES STORE WHEN WE EDIT SANY PRODUCT AND CHANGE IMAGE AUR WE DELETE THAT PRODUCT
const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            throw (err);
        }
    });
}

exports.deleteFile = deleteFile;