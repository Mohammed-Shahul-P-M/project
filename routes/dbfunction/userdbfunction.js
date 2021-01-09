const USER_COLLECTION = 'users'
const db = require('../../config/connection')
const DEALER_COLLECTION = 'dealers'
const ORDERS_COLLECTION = 'orders'
const ORDERhISTORY_COLLECTION = 'orderHistory'
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const { use } = require('../user')

module.exports = {
    // create a user to database 
    createUser: (data) => {
        console.log(data);
        return new Promise(async (resolve, reject) => {
            data.password = await bcrypt.hash(data.password, 10)
            db.get().collection(USER_COLLECTION).insertOne(data).then(result => {
                resolve(result.ops[0])
            }).catch(err => resolve(null))
        })
    },
    // find one user 
    findUser: (data) => {
        return new Promise(async (resolve, reject) => {
            const foundUser = await db.get().collection(USER_COLLECTION).findOne(data)
            resolve(foundUser)
        })
    },
    // function for login to the account
    dologin: (data) => {
        return new Promise(async (resolve, reject) => {
            const foundUser = await db.get().collection(USER_COLLECTION).findOne({ phone: data.phone })
            if (foundUser) {
                bcrypt.compare(data.password, foundUser.password).then(result => {
                    if (result) resolve(foundUser)
                    else resolve(null)
                })
            } else resolve(null)
        })
    },
    // function to update userProfile 
    updateuserProfile: (data, userId) => {
        data.balance = 0
        data.cart = []
        return new Promise((resolve, reject) => {
            db.get().collection(USER_COLLECTION).findOneAndUpdate(
                { _id: ObjectId(userId) },
                { $set: data },
                { returnOriginal: false }
            ).then(result => resolve(result.value))
                .catch(err => resolve(null))
        })
    },
    // function to get all store data
    getStoredata: () => {
        return new Promise(async (resolve, reject) => {
            let data = await db.get().collection(DEALER_COLLECTION).find({ banned: false })
                .project({ _id: 1, store: 1, location: 1, address: 1 })
                .toArray()
            if (data) {
                resolve(data)
            }
            else resolve(null)
        })
    },
    // function to find one store 
    findStore: (id) => {
        return new Promise(async (resolve, reject) => {
            const store = await db.get().collection(DEALER_COLLECTION).findOne({ _id: ObjectId(id), banned: false })
            if (store) resolve(store)
            else resolve(null)
        })
    },
    // function to get all product from a store and details 
    getAllProduct: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(DEALER_COLLECTION).aggregate([
                { $match: { _id: ObjectId(id) } },

            ])
        })
    },
    // function to add a product to cart 
    addTocart: (userId, storeId, prodId, action) => {
        return new Promise(async (resolve, reject) => {
            if (userId && storeId && prodId && action) {
                if (action == 'add') {
                    let order = {
                        storeId: storeId,
                        products: [prodId]
                    }
                    let user = await db.get().collection(USER_COLLECTION).findOneAndUpdate(
                        { _id: ObjectId(userId) },
                        { $push: { cart: order } },
                        { returnOriginal: false }
                    )
                    if (user) resolve(user)
                    else resolve(null)
                } else {
                    let user = await db.get().collection(USER_COLLECTION).findOneAndUpdate(
                        { _id: ObjectId(userId), 'cart.storeId': storeId },
                        { $push: { 'cart.$.products': prodId } },
                        { returnOriginal: false }
                    )
                    if (user) resolve(user)
                    else resolve(null)
                }
            } else resolve(null)
        })
    },
    // function to remove an item from cart from store
    removeFromCart: (userId, storeId, prodId) => {
        return new Promise(async (resolve, reject) => {
            const updatedUserdata = await db.get().collection(USER_COLLECTION).findOneAndUpdate(
                { _id: ObjectId(userId), 'cart.storeId': `${storeId}` },
                { $pull: { 'cart.$.products': `${prodId}` } },
                { returnOriginal: false }
            )
            if (updatedUserdata) resolve(updatedUserdata.value)
            else resolve(null)
        })
    },
    // function to get cart product details for each 
    getCartProductDetails: (storeid, data) => {
        return new Promise(async (resolve, reject) => {
            let startTime = Date.now()
            const foundStore = await db.get().collection(DEALER_COLLECTION).findOne({ _id: ObjectId(storeid), banned: false })
            if (foundStore) {
                let cartItems = []
                let cartTotal = 0
                let TotalItem = 0
                data.forEach(dat => {
                    foundStore.products.forEach(prod => {
                        if (prod._id == dat) {
                            if (prod.unit == 'kg') prod.qnt = 0.1
                            else prod.qnt = 1
                            cartTotal += (prod.qnt * prod.price)
                            TotalItem += 1
                            cartItems.push(prod)
                        }
                    })
                })
                let cart = {
                    storeId: foundStore._id,
                    storeName: foundStore.store,
                    openstatus: foundStore.openStatus,
                    openTime: foundStore.open,
                    closeTime: foundStore.close,
                    cartItems: cartItems,
                    cartTotal: cartTotal,
                    TotalItem: TotalItem
                }
                resolve(cart);
            }
            else resolve({ banned: true });
        })
    },
    // function to remove all product from a cart 
    removeAllFromCart: (id, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(USER_COLLECTION).findOneAndUpdate(
                { _id: ObjectId(userId), 'cart.storeId': `${id}` },
                { $set: { 'cart.$.products': [] } },
                { returnOriginal: false }
            ).then(res => resolve(res.value))
                .catch(err => resolve(null))
        })
    },
    // create new order 
    createOrder: (data) => {
        return new Promise(async (resolve, reject) => {
            data.status = 'pending'
            const placedOrder = await db.get().collection(ORDERS_COLLECTION).insertOne(data)
            resolve(placedOrder.ops[0])
        })
    },
    // function to update stock after an order placed 
    updateStock: (storeid, prodId, qnt) => {
        return new Promise((resolve, reject) => {
            db.get().collection(DEALER_COLLECTION).findOneAndUpdate(
                { _id: ObjectId(storeid), "products._id": ObjectId(prodId) },
                { $inc: { "products.$.stock": qnt * -1 } },
                { returnOriginal: false })
                .then(res => {
                    resolve(res)
                })
        })
    },
    // function to get allorder for a user 
    getOrders: (id) => {
        return new Promise(async (resolve, reject) => {
            let allOrders = await db.get().collection(ORDERS_COLLECTION).find({ 'user.id': `${id}` }).toArray()
            if (allOrders) resolve(allOrders)
            else resolve(null)
        })
    },
    getOrderHistory: (id) => {
        return new Promise(async (resolve, reject) => {
            let allOrderHistory = await db.get().collection(ORDERhISTORY_COLLECTION).find({ 'user.id': `${id}` }).toArray()
            if (allOrderHistory) resolve(allOrderHistory)
            else resolve(null)
        })
    },
    // function to get order date 
    getOrderData: (userId, location, orderId) => {

        return new Promise(async (resolve, reject) => {
            let COLLECTION = ORDERS_COLLECTION
            if (location == 'oh') COLLECTION = ORDERhISTORY_COLLECTION
            let data = await db.get().collection(COLLECTION).findOne({ _id: ObjectId(orderId), 'user.id': `${userId}` })
            if (data) resolve(data)
            else resolve(null)
        })
    },
    // function to update feedback of an order 
    updateFeedback: (feedback, id, userid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(ORDERhISTORY_COLLECTION).findOneAndUpdate(
                { _id: ObjectId(id), 'user.id': `${userid}`, feedback: null },
                { $set: { feedback } }
            ).then(res => resolve(res.value))
                .catch(err => reject(err))
        })
    }
}