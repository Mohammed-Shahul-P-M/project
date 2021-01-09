const router = require("express").Router();
const https = require("https");
const quieryString = require("querystring");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const userDbfunction = require("./dbfunction/userdbfunction");
const user = true;
let errmsg = null;
let allStore = null;

let instance = new Razorpay({
  key_id: "rzp_test_g92IremCNiXMBf",
  key_secret: "kWG2sc3vUVX8wiOiuIL7vpYB",
});
// function for verify user

function veryfyUser(req, res, next) {
  if (req.session.userId && req.session.userData) next();
  else {
    let urls = [
      "/updateProfile",
      "/usersavedStore",
      "/addTocart",
      "/cart/changeQnt",
      "/cart/remove",
      "/cart/removeStore",
      "/cart/place-order",
      "/cart/verifyPayment",
    ];
    let foundUrl = urls.find((url) => url == req.url);
    if (foundUrl) {
      res.json({ loginErr: true });
    } else res.redirect("/login");
  }
}
// home route for user
router.get("/", async (req, res) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  let allStore = await userDbfunction.getStoredata();

  if (req.session.userData) {
    if (!req.session.userData.name || !req.session.userData.email || !req.session.userData.address)
      req.session.userData.profilenotUploaded = true;
  }
  if (req.session.userData && req.session.userData.profilenotUploaded) res.redirect("/profile");
  else res.render("user/home", { user, userData: req.session.userData, allStore });
});
// route for login
router.get("/login", (req, res) => {
  if (req.session.userId) res.redirect("/");
  else
    res.render("login", {
      errmsg,
      userlogin: true,
      formHeading: "Login to account",
      signuproute: "/register",
    });
  errmsg = null;
});
router.post("/login", async (req, res) => {
  const foundUser = await userDbfunction.dologin(req.body);
  if (foundUser) {
    req.session.userId = foundUser._id;
    req.session.userData = foundUser;
    res.redirect("/");
  } else {
    errmsg = "sorry password or username is wrong";
    res.redirect("/login");
  }
});
// router to display profile of user
router.get("/profile", veryfyUser, async (req, res) => {
  let allOrder = await Promise.all([
    userDbfunction.getOrders(req.session.userId),
    userDbfunction.getOrderHistory(req.session.userId),
  ]);
  let orders = allOrder[0].length > 0 ? allOrder[0] : null;
  let ordersHistory = allOrder[1].length > 0 ? allOrder[1].reverse() : null;
  res.render("user/profile", { user, userData: req.session.userData, orders, ordersHistory });
});
// route to give feedback for order
router.get("/feedback/:id", veryfyUser, async (req, res) => {
  if (req.params.id.length == 24) {
    let orderData = await userDbfunction.getOrderData(
      req.session.userId,
      "oh",
      req.params.id
    );
    if (orderData && orderData.status == "delivered")
      res.render("user/feedback", { orderData });
    else res.json("404 error ");
  } else res.json("404 error ");
});
router.post("/feedback", veryfyUser, (req, res) => {
  try {
    let feedback = {
      rating: parseInt(req.body.rating),
      coment: req.body.feedback,
    };
    userDbfunction
      .updateFeedback(feedback, req.body.id, req.session.userId)
      // .then(res => console.log(res))
      .then((result) =>
        result._id
          ? res.redirect("/feedback/" + result._id)
          : res.json("sorry some Error occured")
      )
      .catch((err) => res.json("sorry error occured"));
  } catch (error) {
    res.json("sorry some error occured please try again later");
  }
});
// route to download order deatails
router.get("/download/:location/:id", veryfyUser, async (req, res) => {
  if (req.params.location == "order" || "orderhistory") {
    location = "o";
    if (req.params.location == "orderhistory") location = "oh";
    let data = await userDbfunction.getOrderData(
      req.session.userId,
      location,
      req.params.id
    );
    if (data) {
      var myDoc = new PDFDocument({ bufferPages: true });

      let buffers = [];
      myDoc.on("data", buffers.push.bind(buffers));
      myDoc.on("end", () => {
        let pdfData = Buffer.concat(buffers);
        res
          .writeHead(200, {
            "Content-Length": Buffer.byteLength(pdfData),
            "Content-Type": "application/pdf",
            "Content-disposition": "attachment;filename=details.pdf",
          })
          .end(pdfData);
      });
      let content = `
                       Order Details

                       Order_id             :   ${data._id} 
                       Store_id             :   ${data.storeId}
                       store name           :   ${data.storeName}
                       Total amont          :   ${data.cartTotal} 
                       Total items          :   ${data.TotalItem}
                       Mode of payment      :   ${data.mop}
                       ordered on           :   ${data.date}
                       Delivered on         :   ${data.finishedDate ? data.finishedDate : "not available"
        }
                       Custemer name        :   ${data.user.name}
                       Customer id          :   ${data.user.id}
                       Customer Address     :   ${data.user.address + " ph " + data.user.phone
        }
                       Order status         :   ${data.status} 
                       
                       Product Details      
                       `;
      data.cartItems.forEach((d) => {
        let prodDetails = `
                       ${d.name} (Rs. ${d.price}/${d.unit})  x  ${d.qnt}   =  ${d.price * d.qnt
          }
                       `;
        content += prodDetails;
      });
      content += `
            
            This is system generated document `;
      myDoc.font("Times-Roman").fontSize(12).text(`${content}`);
      myDoc.end();
    } else res.json("404 Not fuond");
  } else res.json("404 Not found");
});
// route to update
router.post("/updateProfile", veryfyUser, (req, res) => {
  let data = {};
  let reqData = req.body;
  let err = "sorry unauthorised";
  if (req.session.userData.profilenotUploaded) {
    try {
      data.email = req.body.email;
      data.name = req.body.name;
      data.address = req.body.address;
    } catch (error) {
      console.log(error);
      err = "sorry all feilds are mandatary";
    }
  } else {
    if (reqData.name) data.name = reqData.name;
    if (reqData.email) data.email = reqData.email;
    if (reqData.address) data.address = reqData.address;
  }
  if (data == {}) res.json({ err: err });
  else {
    userDbfunction
      .updateuserProfile(data, req.session.userId)
      .then((result) => {
        if (result) {
          userData = result;
          res.json("ok success");
        } else res.json({ err: "sorry some error occured" });
      })
      .catch((err) =>
        res.json({
          err: "some internal error plaese upload document once again",
        })
      );
  }
});
/* route for logout */
router.get("/logout", veryfyUser, (req, res) => {
  req.session.destroy();
  errmsg = null;
  res.redirect("/");
});
// rute to provide requiered data
router.get("/getdata", (req, res) => {
  userDbfunction.getStoredata().then((data) => {
    allStore = data;
    res.json(data);
  });
});
router.get("/usersavedStore", veryfyUser, (req, res) => {
  let savedStore = [];
  req.session.userData.cart.forEach((e) => {
    let index = allStore.findIndex((store) => store._id == e.storeId);
    savedStore.push(allStore[index]);
  });
  res.json(savedStore);
});
// route to dispaly each store
let storeId = null;
router.get("/store/:storeId", async (req, res) => {
  storeId = req.params.storeId;
  const store = await userDbfunction.findStore(storeId);
  if (store) {
    let products = [];
    store.catogories.forEach((cat) => {
      products.push({ name: cat, products: [] });
    });
    store.products.forEach((product) => {
      products.forEach((p) => {
        if (p.name == product.catogory && product.status)
          p.products.push(product);
      });
    });
    let newProducts = [];
    products.forEach((p, i) => {
      if (p.products.length > 0) newProducts.push(p);
    });
    delete store.name;
    delete store.password;
    delete store.catogories;
    delete store.banned;
    delete store.profilePic;
    store.products = newProducts;
    delete store.email;
    delete store.phone;
    res.render("user/storeinfo", { user, store, userData: req.session.userData });
  } else res.json("404 not found");
});
//route for adding product to cart
router.post("/addTocart", veryfyUser, (req, res) => {
  storeId == req.headers.referer.split("/")[4];
  let action = null;
  let prodIndex = null;
  let storeIndex = req.session.userData.cart.findIndex((order) => order.storeId == storeId);
  if (storeIndex == -1) action = "add";
  else {
    prodIndex = req.session.userData.cart[storeIndex].products.findIndex(
      (prod) => prod == req.body.prodId
    );
    if (prodIndex == -1) action = "update";
    else res.json("added");
  }
  if (action) {
    userDbfunction
      .addTocart(req.session.userId, storeId, req.body.prodId, action)
      .then((result) => {
        if (result) {
          req.session.userData = result.value;
          res.json("ok");
        } else res.json({ err: "sorry some internal error" });
      });
  }
});
// route to show cart
router.get("/cart", veryfyUser, async (req, res) => {
  if (req.session.userData.cart.length > 0) {
    let promisList = [];
    let promis = null;
    req.session.userData.cart.forEach((item, i) => {
      if (item.products.length > 0) {
        promis = userDbfunction.getCartProductDetails(
          item.storeId,
          item.products
        );
        promisList.push(promis);
      }
    });
    req.session.cartItems = await Promise.all(promisList);
  }
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  res.render("user/cart", { user, cartItems: req.session.cartItems, userData: req.session.userData });
});
// route change the qnt of a product in cart
router.post("/cart/changeQnt", veryfyUser, (req, res) => {
  let reqData = req.body;
  try {
    reqData.qnt = parseInt(reqData.qnt);
    let cordinates = reqData.cordinate.split("/");
    let product = req.session.cartItems[cordinates[0]].cartItems[cordinates[1]];
    let oldCost = product.price * product.qnt;
    let doesChangeHappend = false;
    if (product.unit == "kg") {
      if (reqData.qnt >= 100 && reqData.qnt % 50 == 0) {
        product.qnt = reqData.qnt / 1000;
        var newCost = (reqData.qnt * product.price) / 1000;
        doesChangeHappend = true;
      }
    } else if (reqData.qnt >= 1) {
      var newCost = reqData.qnt * product.price;
      product.qnt = reqData.qnt;
      doesChangeHappend = true;
    }
    if (doesChangeHappend) {
      req.session.cartItems[cordinates[0]].cartTotal += newCost - oldCost;
      req.session.cartItems[cordinates[0]].cartItems[cordinates[1]] = product;
      let newCartTotal = req.session.cartItems[cordinates[0]].cartTotal;
      res.json({ cartTotal: newCartTotal, newCost: newCost });
    } else res.json({ err: "soory" });
  } catch (error) {
    res.json({ err: "sorry some error please check value" });
  }
});
// route to remove an item from
router.post("/cart/remove", veryfyUser, (req, res) => {
  let reqData = req.body;
  try {
    let cartItem = req.session.cartItems[reqData.n];
    let reqProduct = cartItem.cartItems[reqData.m];
    userDbfunction
      .removeFromCart(req.session.userId, cartItem.storeId, reqProduct._id)
      .then((result) => {
        if (result) {
          req.session.userData = result;
          cartItem.cartTotal =
            cartItem.cartTotal - reqProduct.qnt * reqProduct.price;
          cartItem.TotalItem = cartItem.TotalItem - 1;
          cartItem.cartItems[reqData.m] = "removed";
          req.session.cartItems[reqData.n] = cartItem;
          res.json({
            cartTotal: cartItem.cartTotal,
            totalItem: cartItem.TotalItem,
          });
        } else res.json({ err: "error occured" });
      });
  } catch (error) {
    res.json({ err: "sorry error" });
  }
});
//route to remove all cartItems from an order
router.post("/cart/removeStore", veryfyUser, (req, res) => {
  userDbfunction.removeAllFromCart(req.body.Id, req.session.userId).then((result) => {
    if (result) {
      req.session.userData = result;
      res.json("ok");
    } else res.json({ err: "sorry error" });
  });
});

// route to place order
router.post("/cart/place-order", veryfyUser, (req, res) => {
  req.session.modeOfpayment = req.body.mop;
  req.session.temp_order_id = req.body.id;
  let orderProduct = req.session.cartItems[req.body.id];
  if (req.session.modeOfpayment == "rzpay") {
    var options = {
      amount: orderProduct.cartTotal * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: req.session.userId + "" + Date.now(),
    };
    instance.orders.create(options, function (err, order) {
      let Order = {
        id: order.id,
        amount: order.amount,
        name: req.session.userData.name,
        phone: req.session.userData.phone,
        email: req.session.userData.email,
      };
      res.json(Order);
    });
  } else {
    req.session.modeOfpayment = "COD";
    res.json({ mop: "cod" });
  }
});
// router to verify payment

router.post("/cart/verifyPayment", veryfyUser, (req, res) => {
  let data = req.body;
  let order = req.session.cartItems[req.session.temp_order_id];
  order.mop = "COD";
  var now = new Date() + "";
  var getTheDate = now.slice(0, now.length - 32);
  order.date = getTheDate;
  function generateOrder() {
    order.user = {
      id: req.session.userId,
      name: req.session.userData.name,
      phone: req.session.userData.phone,
      address: req.session.userData.address,
    };
    userDbfunction.createOrder(order).then((result) => {
      req.session.orderdata = {
        total: result.cartTotal,
        mop: result.mop,
      };
      userDbfunction
        .removeAllFromCart(result.storeId, req.session.userId)
        .then(result => {
          req.session.userData = result
          res.json("ok success");
        });
      result.cartItems.forEach((i) => {
        userDbfunction.updateStock(result.storeId, i._id, i.qnt);
      });
    });
  }
  if (req.session.modeOfpayment == "rzpay") {
    let hmac = crypto.createHmac("sha256", "kWG2sc3vUVX8wiOiuIL7vpYB");
    hmac.update(
      data["payment[razorpay_order_id]"] +
      "|" +
      data["payment[razorpay_payment_id]"]
    );
    hmac = hmac.digest("hex");
    if (hmac == data["payment[razorpay_signature]"]) {
      order.mop = "online";
      generateOrder();
    } else res.json({ err: "payment faild" });
  } else if (req.session.modeOfpayment == "COD") {
    generateOrder();
  }
});
// route to display order placed success message
router.get("/order-success", veryfyUser, (req, res) => {
  if (req.session.orderdata) res.render("user/ordersuccess", { user, orderdata: req.session.orderdata });
  else res.redirect("/");
  req.session.orderdata = null;
});
// router for register a user
router.get("/register", (req, res) => {
  if (req.session.userId) res.redirect("/");
  else
    res.render("login", {
      user,
      signup: true,
      formHeading: "Register your account",
      loginroute: "/login",
    });
});

router.post("/register", async (req, res) => {
  let reqData = req.body;

  if (reqData.resend) {
    const data = quieryString.stringify({
      otp_id: req.session.otp_id,
    });
    const url = "https://d7networks.com/api/verifier/resend";
    const options = {
      method: "post",
      headers: {
        Authorization: "Token ce8087d6a5e653b4fa3795e4cddfdb433b8ba5cd",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };
    const request = https.request(url, options, (response) => {
      response.on("data", (data) => {
        let result = JSON.parse(data);
        if (result.resend_count > 3)
          res.json({ badErr: "sorry system is currently broken" });
        else res.json("ok success");
      });
    });
    request.write(data);
    request.end();
  }
  // function to verify enterd otp
  else if (reqData.verify) {
    const url = "https://d7networks.com/api/verifier/verify";
    const data = quieryString.stringify({
      otp_id: req.session.otp_id,
      otp_code: reqData.otp,
    });
    const options = {
      method: "post",
      headers: {
        Authorization: "Token ce8087d6a5e653b4fa3795e4cddfdb433b8ba5cd",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };
    const request = https.request(url, options, (response) => {
      response.on("data", (data) => {
        let result = JSON.parse(data);

        if (result.status) {
          userDbfunction.createUser(req.session.registerData).then((result) => {
            if (result) {
              req.session.userId = result._id;
              req.session.userData = result
              res.json("ok success");
            } else res.json({ err: "sorry error occured" });
          });
        } else
          res.json({ err: "invalid otp please check again or click resend" });
      });
    });
    request.write(data);
    request.end();
  }
  // function to generate otp for provided phone number
  else {
    let findUser = await userDbfunction.findUser({ phone: reqData.phone });
    if (findUser)
      res.json({ err: "sorry user Exist with the same phone number" });
    else {
      req.session.registerData = reqData;
      const data = quieryString.stringify({
        mobile: "+91" + req.body.phone,
        message: "Welcome to Big mart your otp is {code}",
      });
      const url = "https://d7networks.com/api/verifier/send";
      const options = {
        method: "post",
        headers: {
          Authorization: "Token ce8087d6a5e653b4fa3795e4cddfdb433b8ba5cd",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      };
      const requiest = https.request(url, options, (response) => {
        response.on("data", (data) => {
          let result = JSON.parse(data);
          if (result.otp_id) {
            req.session.otp_id = result.otp_id;
            res.json("ok success");
          } else res.json({ err: "Sorry some error occured" });
        });
      });
      requiest.write(data);
      requiest.end();
    }
  }
});

module.exports = router;
