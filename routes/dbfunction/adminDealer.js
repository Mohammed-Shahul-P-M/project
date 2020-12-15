const db = require('../../config/connection')
const DEALER_COLLECTION = 'dealers'
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

module.exports = {
    // function to add a dealer to database 
    createDealer: (dealerData) => {
        return new Promise(async (resolve, reject) => {
            const ExistingDealer = db.get().collection(DEALER_COLLECTION)
                .findOne({ $or: [{ email: dealerData.email }, { phone: dealerData.phone }] })
            let password = bcrypt.hash('1234', 10)
            Promise.all([ExistingDealer, password]).then(values => {

                if (values[0]) {
                    let err = 'found a match with same '
                    if (values[0].email == dealerData.email) err += 'email, '
                    if (values[0].phone == dealerData.phone) err += 'phone, '
                    reject(err)
                }
                else {
                    dealerData.password = values[1]
                    dealerData.openStatus = false
                    dealerData.banned = false
                    dealerData.products = []
                    dealerData.catogories = []
                    db.get().collection(DEALER_COLLECTION).insertOne(dealerData)
                        .then(dealer => {
                            resolve(dealer.ops[0])
                        }).catch(err => reject({ err: 'sorry some err in the database' }))
                }
            })
        })
    },
    // function to find all dealers in the data base
    getallDealers: () => {

        return new Promise(async (resolve, reject) => {

            const dealers = await db.get().collection(DEALER_COLLECTION).find({}).toArray()

            resolve(dealers)
        })
    },
    // function to get a specific dealer details 
    getOneDealer: (dealerId) => {
        return new Promise(async (resolve, reject) => {
            const dealer = await db.get().collection(DEALER_COLLECTION).findOne({ _id: ObjectId(dealerId) })
            if (dealer) {

                resolve(dealer)
            } else resolve(null)
        })
    },
    // function to edit a specific dealer 
    editOneDealer: (data) => {

        return new Promise(async (resolve, reject) => {
            let dealerId = data.id
            delete data.id

            const updatedDealer = await db.get().collection(DEALER_COLLECTION).findOneAndUpdate(
                { _id: ObjectId(dealerId) },
                { $set: data },
                { returnOriginal: false }
            )

            resolve(updatedDealer.value)
        })
    },
    // function to delete a dealer from data base 
    deleteDealer: (id) => {
        return new Promise(async (resolve, reject) => {
            const deletedDealer = await db.get().collection(DEALER_COLLECTION).findOneAndDelete(
                { _id: ObjectId(id) },
                { returnOriginal: false }
            )
            if (deletedDealer.value) {
                resolve(deletedDealer.value)
            } else reject(null)
        })
    }
}