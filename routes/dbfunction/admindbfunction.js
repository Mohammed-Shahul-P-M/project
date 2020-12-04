const db = require('../../config/connection')
const ADMIN_COLLECTION = 'admin'
const bcrypt = require('bcrypt')


const objectId = require('mongodb').ObjectID

module.exports = {
    //    function to update admins password

    updateAdmin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let oldname = adminData.oldname
            delete adminData.oldname
            adminData.password = await bcrypt.hash(adminData.password, 10)
            db.get().collection(ADMIN_COLLECTION).findOneAndUpdate(
                { name: oldname },
                { $set: adminData },
                { returnOriginal: false }
            ).then(data => {

                resolve(data)
            })
        })
    },
    // function to check if the admin does exist or not
    doLogin: (adminData) => {

        return new Promise(async (resolve, reject) => {
            const Admin = await db.get().collection(ADMIN_COLLECTION).findOne({ name: adminData.name })
            if (Admin) {

                bcrypt.compare(adminData.password, Admin.password).then(admin => {
                    if (admin) resolve(Admin)
                    else resolve(null)
                })


            } else resolve(null)
        })
    },
    // function to desable or enabele whole app 
    desableApp: (data) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(ADMIN_COLLECTION).findOneAndUpdate(
                { name: data.name },
                { $set: { appStatus: data.status } },
                { returnOriginal: false }
            ).then(response => {
                resolve(response)
            })
        })
    }
}