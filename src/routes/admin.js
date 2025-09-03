const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Product = require("../models/Product");
const Catalogue = require("../models/Catalogue");

const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

/* ------------------------------------------------
   PRODUCT ROUTES
------------------------------------------------ */

// Add Product Page
router.get("/admin/add-product", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin/add-product.html"));
});

// Serve addcatalogues.html
router.get("/admin/add-catalogues", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin/addcatalogue.html"));
});

// Add Product
router.post("/admin/add-product", upload.single("image"), async (req, res) => {
  try {
    const { name, price, discount, description } = req.body;
    const catalogues = req.body["catalogues[]"] || req.body.catalogues; // fallback
    const image = req.file ? `/uploads/${req.file.filename}` : "";

    const newProduct = new Product({
      image,
      name,
      price,
      discount,
      description,
      catalogues, // ✅ array of "Catalogue - Model"
    });

    await newProduct.save();

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


// Get all products (JSON)
router.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).send("Error fetching products");
  }
});

// View Product Page
router.get("/admin/view-product", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin/view-product.html"));
});

// Edit Product Page
router.get("/admin/edit-product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.render("edit-product", { product });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
});

// Update Product
router.post("/admin/edit-product/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, price, discount, description, catalogues } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    let imagePath = product.image;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
      const oldImagePath = path.join(__dirname, "../public", product.image);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }

    product.name = name;
    product.price = price;
    product.discount = discount;
    product.description = description;
    product.catalogues = catalogues;
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

// Get single product JSON
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

// Delete product
router.get("/admin/delete-product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    const imagePath = path.join(__dirname, "../public", product.image);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

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

// API: Get existing catalogues for dropdown
router.get("/api/catalogues", async (req, res) => {
  try {
    const catalogues = await Catalogue.find();
    res.json(catalogues);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch catalogues" });
  }
});

// API: Add new catalogue or add model to existing one
router.post("/admin/add-catalogues", async (req, res) => {
  const { existingCatalogue, newCatalogue, modelName } = req.body;

  try {
    let catalogueName = newCatalogue && newCatalogue.trim() !== ""
                        ? newCatalogue
                        : existingCatalogue;

    if (!catalogueName) {
      return res.status(400).send("Please select or enter a catalogue name");
    }

    let catalogue = await Catalogue.findOne({ name: catalogueName });

    if (!catalogue) {
      // create new catalogue
      catalogue = new Catalogue({ name: catalogueName, models: [modelName] });
    } else {
      // add new model to existing catalogue
      if (!catalogue.models.includes(modelName)) {
        catalogue.models.push(modelName);
      }
    }

  await catalogue.save();
  res.redirect("/admin/add-catalogues?success=1");


  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving catalogue");
  }
});


module.exports = router;
