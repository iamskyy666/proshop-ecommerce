import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from "colors";
import users from "./data/users.js";
import User from "./models/userModel.js";
import Product from "./models/productModel.js";
import Order from "./models/orderModel.js";
import connectDB from "./config/db.js";
import products from "./data/products.js";

dotenv.config();
connectDB();

// import
async function importData() {
  try {
    // first delete
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    // then, create.
    const createdUsers = await User.insertMany(users);
    const adminUser = createdUsers[0]._id;

    const sampleProducts = products.map((product) => {
      return { ...product, user: adminUser };
    });

    await Product.insertMany(sampleProducts);
    console.log("Data Imported!".green.inverse);
    process.exit();
  } catch (error) {
    console.error(`⚠️ERROR importing data: ${error.message}`.red.inverse);
    process.exit(1);
  }
}

// destroy
async function destroyData() {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log("Data Destroyed!".red.inverse);
    process.exit();
  } catch (error) {
    console.error(`⚠️ERROR destroying data: ${error.message}`.red.inverse);
    process.exit(1);
  }
}

// execute..
if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
