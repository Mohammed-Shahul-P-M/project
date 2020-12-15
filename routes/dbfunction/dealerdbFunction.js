const db = require('../../config/connection')
const DEALER_COLLECTION = 'dealers'
const PRODUCT_COLLECTION = 'products'
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

module.exports = {
    // function to veryfy dealer 
    doLogin: (data) => {
        return new Promise(async (resolve, reject) => {
            const foundDealer = await db.get().collection(DEALER_COLLECTION).findOne({ email: data.email })
            if (foundDealer) {

                bcrypt.compare(data.password, foundDealer.password).then(dealer => {
                    if (dealer) resolve(foundDealer)
                    else resolve(null)
                })
            } else resolve(null)
        })
    },
    //function to update catogory list 
    updateCatogory: (data, id) => {
        db.get().collection(DEALER_COLLECTION).findOneAndUpdate(
            { _id: ObjectId(id) },
            { $push: { catogories: data } }
        )
    }
    ,
    //function to add products to database
    createProduct: (data, id) => {
        return new Promise(async (resolve, reject) => {
            data._id = ObjectId()
            data.status = true
            db.get().collection(DEALER_COLLECTION).findOneAndUpdate(
                { _id: ObjectId(id) },
                { $push: { products: data } },
                { returnOriginal: false }
            ).then(result => {
                resolve(result)
            }).catch(err => reject(err))
        })
    },
    // disable a product
    disableProduct: (data, id) => {
        if (data.status == 'true') data.status = true
        else if (data.status == 'false') data.status = false
        return new Promise(async (resolve, reject) => {
            db.get().collection(DEALER_COLLECTION).findOneAndUpdate(
                { _id: ObjectId(id), "products._id": ObjectId(data.id) },
                { $set: { "products.$.status": data.status } },
                { returnOriginal: false }
            ).then(result => {
                resolve(result.value.products)
            })
        })
    },
    // update a specific product
    UpdateProduct: (data, id) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(DEALER_COLLECTION).findOneAndUpdate(
                { _id: ObjectId(id), "products._id": ObjectId(data.id) },
                {
                    $set: {
                        "products.$.name": data.name,
                        "products.$.catogory": data.catogory,
                        "products.$.price": data.price
                    }
                },
                { returnOriginal: false }
            ).then(result => resolve(result.value.products))
        })
    },
    // function to change a product image
    updateImageName: (imagename, prodId, dealerId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(DEALER_COLLECTION).findOneAndUpdate(
                { _id: ObjectId(dealerId), "products._id": ObjectId(prodId) },
                { $set: { "products.$.prodImage": imagename } },
                { returnOriginal: false }
            ).then(result => resolve(result.value.products))
        })
    },
    addStock: (stock, Id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(DEALER_COLLECTION).findOneAndUpdate(
                { _id: ObjectId(Id), "products._id": ObjectId(stock.id) },
                { $inc: { "products.$.stock": stock.stock } },
                { returnOriginal: false }
            ).then(result => resolve(result.value.products))
        })
    },
    // function to delete a product
    deleteProduct: (id, dealerId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(DEALER_COLLECTION).findOneAndUpdate(
                { _id: ObjectId(dealerId) },
                { $pull: { products: { _id: ObjectId(id) } } },
                { returnOriginal: false }
            ).then(result => resolve(result))
        })
    },
    // function to update timing of the shop 
    updateTime: (data, id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(DEALER_COLLECTION).findOneAndUpdate(
                { _id: ObjectId(id) },
                { $set: data },
                { returnOriginal: false }
            ).then(result => resolve(result.value))
        })
    },
    closeShop: (data, id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(DEALER_COLLECTION).findOneAndUpdate(
                { _id: ObjectId(id) },
                { $set: data },
                { returnOriginal: false },
                { $project: { openStatus: 1 } }
            ).then(result => resolve(result))
        })
    },
    // function to dealer personal info 
    editDealerInfo: (data, id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(DEALER_COLLECTION).findOneAndUpdate(
                { _id: ObjectId(id) },
                { $set: data },
                { returnOriginal: false }
            ).then(result => resolve(result.value))
        })
    },
    // function to change the password of dealer 
    changePassword: (data, id) => {
        return new Promise(async (resolve, reject) => {
            let promis1 = bcrypt.hash(data.password, 10)
            let promis2 = db.get().collection(DEALER_COLLECTION).findOne({ _id: ObjectId(id) })
            let values = await Promise.all([promis1, promis2])
            let newPassword = values[0]
            let foundDealer = values[1]
            if (foundDealer) {
                let checkOldPassword = await bcrypt.compare(data.oldpassword, foundDealer.password)
                if (checkOldPassword) {
                    let changedDealer = await db.get().collection(DEALER_COLLECTION).findOneAndUpdate(
                        { _id: ObjectId(id) },
                        { $set: { password: newPassword } },
                        { returnOriginal: false })
                    if (changedDealer) resolve('Password changed succesfully')
                    else resolve({ err: 'sorry some error occured' })
                } else resolve({ err: 'Old Password is wrong' })
            } else resolve({ err: 'user not found' })
        })
    },
    // function to get all data 
    getAlldata: (id) => {
        return new Promise(async (resolve, reject) => {
            const foundDealer = await db.get().collection(DEALER_COLLECTION).findOne({ _id: ObjectId(id) })
            if (foundDealer) resolve(foundDealer)
            else reject(null)
        })
    }
}
