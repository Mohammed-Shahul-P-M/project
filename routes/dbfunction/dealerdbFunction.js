const db = require('../../config/connection')
const DEALER_COLLECTION = 'dealers'
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

module.exports = {
    // function to veryfy dealer 
    doLogin: (data) => {
        return new Promise(async (resolve, reject) => {
            const foundDealer = await db.get().collection(DEALER_COLLECTION).findOne({ name: data.name })
            if (foundDealer) {

                bcrypt.compare(data.password, foundDealer.password).then(dealer => {
                    if (dealer) resolve(foundDealer)
                    else resolve(null)
                })
            } else resolve(null)
        })
    }
}