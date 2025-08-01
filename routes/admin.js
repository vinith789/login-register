const express = require("express");
const multer = require("multer");
const path = require("path");
const Product = require("../models/Product");
const fs = require("fs");

const router = express.Router();

// Storage config for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.get("/admin/add-product", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin/add-product.html"));
});


// Route to handle form submission
router.post("/add-product", upload.single("image"), async (req, res) => {
  try {
    const { name, price, discount, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "";

    const newProduct = new Product({
      image,
      name,
      price,
      discount,
      description,
    });

    await newProduct.save();

    // Send HTML response with alert and redirect
    res.send(`
      <script>
        alert("Product added successfully!");
        window.location.href = "/admin/view-product";
      </script>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding product.");
  }
});

router.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).send("Error fetching products");
  }
});

router.get("/admin/view-product", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin/view-product.html"));
});


// GET: Edit page
router.get("/edit-product/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await Product.findById(productId);
    res.render("edit-product", { product });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
});


// POST: Update product
router.post("/admin/edit-product/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, price, discount, description } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    let imagePath = product.image;

    // If a new image is uploaded
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
      // Delete old image
      const oldImagePath = path.join(__dirname, "../public", product.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update fields
    product.name = name;
    product.price = price;
    product.discount = discount;
    product.description = description;
    product.image = imagePath;

    await product.save();

    res.send(`
      <script>
        alert("Product updated successfully!");
        window.location.href = "/admin/view-product";
      </script>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating product");
  }
});

// GET: Get single product for edit page
router.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching product");
  }
});


// detele product
router.get("/admin/delete-product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    // Delete image
    const imagePath = path.join(__dirname, "../public", product.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Delete product
    await Product.deleteOne({ _id: req.params.id });

    res.send(`
      <script>
        alert("Product deleted successfully!");
        window.location.href = "/admin/view-product";
      </script>
    `);
  } catch (err) {
    res.status(500).send("Error deleting product");
  }
});



module.exports = router;
