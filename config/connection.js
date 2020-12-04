const MongoClient = require('mongodb').MongoClient

const atlasUrl = 'mongodb+srv://shahulpm:3ZZsZTnkOmhlIZkz@cluster0.i6dzb.mongodb.net/groceryDb?retryWrites=true&w=majority'
let db = null

module.exports.connect = function (callback) {
    const dbname = 'groceryDb'
    const url = 'mongodb://localhost:27017/' + dbname

    MongoClient.connect(url, { useUnifiedTopology: true }, (err, data) => {
        if (err) {
            MongoClient.connect(atlasUrl, { useUnifiedTopology: true }, (err, data) => {
                if (err) return callback(err)
                db = data.db(dbname)
                callback()
            })
            return callback(' err at localhost')
        }
        db = data.db(dbname)
        callback()
    })
}

module.exports.get = function () {
    return db
}
module.exports.db = db