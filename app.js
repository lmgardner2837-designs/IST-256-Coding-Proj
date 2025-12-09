

const express = require("express");
const path = require("path");
const cors = require("cors");
const { Sequelize, DataTypes } = require("sequelize");



const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));


const sequelize = new Sequelize("projectDB", "root", "LG.10093677!", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
});

sequelize
  .authenticate()
  .then(() => console.log("✅ Connected to MySQL"))
  .catch((err) => console.error("❌ MySQL connection error:", err));



// BILL MODEL
const Bill = sequelize.define(
  "Bill",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    zip: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    card: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    cvv: {
      type: DataTypes.STRING(4),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
  tableName: "bills",
  timestamps: false,   
  }
);


// RETURN REQUEST MODEL
const ReturnRequest = sequelize.define(
  "ReturnRequest",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    full_name: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: false },
    product_sku: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    tableName: "return_requests",
    timestamps: true,          
  }
);



const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sku: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    in_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "products",  
    timestamps: false,      
  }
);



const CartItem = sequelize.define(
  "CartItem",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    shopper_email: { type: DataTypes.STRING, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    price_each: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  {
    tableName: "cart_items",
    timestamps: false,
  }
);


app.post("/cart", async (req, res) => {
  const { shopper_email, items } = req.body;

  if (!shopper_email || !Array.isArray(items)) {
    return res
      .status(400)
      .json({ error: "shopper_email and items[] are required" });
  }

  try {
    await sequelize.query(
      "DELETE FROM cart_items WHERE shopper_email = ?",
      { replacements: [shopper_email] }
    );

    if (!items.length) {
      return res.json({ ok: true, rowsInserted: 0 });
    }

    const values = [];
    const placeholders = [];

    for (const item of items) {
      if (
        item.product_id == null ||
        item.quantity == null ||
        item.price_each == null
      ) {
        continue;
      }

      placeholders.push("(?, ?, ?, ?)");
      values.push(
        shopper_email,
        item.product_id,
        item.quantity,
        item.price_each
      );
    }

    if (!placeholders.length) {
      return res.json({ ok: true, rowsInserted: 0 });
    }

    const sql = `
      INSERT INTO cart_items
        (shopper_email, product_id, quantity, price_each)
      VALUES ${placeholders.join(", ")}
    `;

    await sequelize.query(sql, { replacements: values });

    res.json({ ok: true, rowsInserted: items.length });
  } catch (err) {
    console.error("Error saving cart:", err);
    res.status(500).json({ error: err.message });
  }
});




Product.hasMany(CartItem, { foreignKey: "product_id" });
CartItem.belongsTo(Product, { foreignKey: "product_id" });

// SIGNUPS MODEL
const Signup = sequelize.define(
  "Signup",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING
    },
    age: {
      type: DataTypes.INTEGER
    },
    address: {
      type: DataTypes.STRING
    }
  },
  {
    tableName: "Signups",   // <-- matches your actual table name
    timestamps: false       // <-- your table does NOT have createdAt/updatedAt
  }
);


app.get("/bills", async (req, res) => {
  try {
    const bills = await Bill.findAll({
      order: [["id", "DESC"]],  
    });
    res.json(bills);
  } catch (err) {
    console.error("Error in GET /bills:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.post("/bills", async (req, res) => {
  try {
    console.log("POST /bills body:", req.body);
    const bill = await Bill.create(req.body);
    res.status(201).json(bill);
  } catch (err) {
    console.error("Error in POST /bills:", err);
    res.status(400).json({ error: err.message });
  }
});


app.delete("/bills/:id", async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ error: "Bill not found" });
    await bill.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE /bills/:id:", err);
    res.status(400).json({ error: err.message });
  }
});


// GET all returns (optionally filter by status)
app.get("/returns", async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;

    const returns = await ReturnRequest.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    res.json(returns);
  } catch (err) {
    console.error("Error in GET /returns:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// CREATE a new return
app.post("/returns", async (req, res) => {
  try {
    const { full_name, email, sku, quantity, reason } = req.body;

    const saved = await ReturnRequest.create({
      full_name,
      email,
      product_sku: sku,
      quantity,
      reason,
      status: "pending",
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error("Error inserting return:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE status (approve / reject)
app.put("/returns/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    const row = await ReturnRequest.findByPk(id);
    if (!row) return res.status(404).json({ error: "Not found" });

    row.status = status;
    await row.save();

    res.json(row);
  } catch (err) {
    console.error("Error updating return:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/returns/:id", async (req, res) => {
  try {
    const ret = await ReturnRequest.findByPk(req.params.id);
    if (!ret) return res.status(404).json({ error: "Return not found" });
    await ret.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE /returns/:id:", err);
    res.status(400).json({ error: err.message });
  }
});



app.get("/products", async (req, res) => {
  try {
    const products = await Product.findAll({ order: [["sku", "ASC"]] });
    res.json(products);
  } catch (err) {
    console.error("Error in GET /products:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/products", async (req, res) => {
  try {
    console.log("POST /products body:", req.body);
    const product = await Product.create(req.body);
    res.json(product);
  } catch (err) {
    console.error("Error in POST /products:", err);
    res.status(400).json({ error: err.message });
  }
});

app.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    await product.update(req.body);
    res.json(product);
  } catch (err) {
    console.error("Error in PUT /products/:id:", err);
    res.status(400).json({ error: err.message });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    await product.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE /products/:id:", err);
    res.status(400).json({ error: err.message });
  }
});


app.get("/cart/:sessionId", async (req, res) => {
  try {
    const items = await CartItem.findAll({
      where: { session_id: req.params.sessionId },
      include: Product,
    });
    res.json(items);
  } catch (err) {
    console.error("Error in GET /cart/:sessionId:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.post("/cart", async (req, res) => {
  try {
    const { shopper_email, items } = req.body;

    if (!shopper_email || !Array.isArray(items)) {
      return res.status(400).json({ error: "shopper_email and items[] required" });
    }

    await CartItem.destroy({ where: { shopper_email } });

    const savedRows = await CartItem.bulkCreate(
      items.map(item => ({
        shopper_email,
        product_id: item.product_id,   
        quantity: item.quantity,
        price_each: item.price_each  
      }))
    );

    res.json({ ok: true, rows: savedRows.length });
  } catch (err) {
    console.error("Error saving cart:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.delete("/cart/item/:id", async (req, res) => {
  try {
    const item = await CartItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Cart item not found" });
    await item.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE /cart/item/:id:", err);
    res.status(400).json({ error: err.message });
  }
});

app.delete("/cart/:sessionId", async (req, res) => {
  try {
    await CartItem.destroy({ where: { session_id: req.params.sessionId } });
    res.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE /cart/:sessionId:", err);
    res.status(400).json({ error: err.message });
  }
});


app.post("/signups", async (req, res) => {
  try {
    const signup = await Signup.create(req.body);
    res.status(201).json(signup);
  } catch (err) {
    console.error("Error in POST /signups:", err);
    res.status(400).json({ error: err.message });
  }
});

app.get("/signups", async (req, res) => {
  try {
    const list = await Signup.findAll();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

sequelize
  .sync()
  .then(() => {
    console.log("✅ DB Synced with MySQL");
    app.listen(3000, () => {
      console.log("🚀 Server running at http://localhost:3000");
    });
  })
  .catch((err) => {
    console.error("❌ Error syncing DB:", err);
  });

  const ConferenceSignup = sequelize.define(
  "ConferenceSignup",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    option_id: {
      // e.g. "virtual", "in_person", or option code
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    dietary_restrictions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "conference_signups",
    timestamps: true,
    createdAt: "created_at", 
    updatedAt: false,        
  }
);

app.post("/conference_signups", async (req, res) => {
  try {
    console.log("POST /conference_signups body:", req.body);
    const signup = await ConferenceSignup.create(req.body);
    res.status(201).json(signup);
  } catch (err) {
    console.error("Error in POST /conference_signups:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/conference_signups", async (req, res) => {
  try {
    const rows = await ConferenceSignup.findAll({ order: [["id", "ASC"]] });
    res.json(rows);
  } catch (err) {
    console.error("Error in GET /conference_signups:", err);
    res.status(500).json({ error: err.message });
  }
});
