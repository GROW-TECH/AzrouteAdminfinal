'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Table, Button, Form, Row, Col, InputGroup, FormControl } from 'react-bootstrap';

export default function ProductPage() {

  const BUCKET = "product_images";

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("add");

  const [currentUser, setCurrentUser] = useState(null);

  const [form, setForm] = useState({
    id: null,
    name: "",
    description: "",
    price: "",
    image_path: ""
  });

  const fileRef = useRef(null);

  // Load current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data?.user || null);
    });
  }, []);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);

    setProducts(data || []);
    setFiltered(data || []);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Upload image
  async function uploadImage(file) {
    if (!file) return null;

    const fileName = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file);

    if (error) {
      alert("Image upload failed: " + error.message);
      return null;
    }

    return data.path;
  }

  // Add / Update product
  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name || !form.price) {
      alert("Product Name & Price required!");
      return;
    }

    let imagePath = form.image_path;
    const file = fileRef.current?.files?.[0];

    if (file) {
      const uploaded = await uploadImage(file);
      if (uploaded) imagePath = uploaded;
    }

    const payload = {
      name: form.name,
      description: form.description,
      price: form.price,
      image_path: imagePath,
      created_by: currentUser?.id || null
    };

    if (mode === "add") {
      const { error } = await supabase.from("products").insert(payload);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from("products").update(payload).eq("id", form.id);
      if (error) alert(error.message);
    }

    closeForm();
    fetchProducts();
  }

  function openAdd() {
    setMode("add");
    setForm({ id: null, name: "", price: "", description: "", image_path: "" });
    if (fileRef.current) fileRef.current.value = "";
    setShowForm(true);
  }

  function openEdit(row) {
    setMode("edit");
    setForm(row);
    if (fileRef.current) fileRef.current.value = "";
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm({ id: null, name: "", price: "", description: "", image_path: "" });
    if (fileRef.current) fileRef.current.value = "";
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;

    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  }

  function handleSearch() {
    const term = searchTerm.toLowerCase();

    if (!term) return setFiltered(products);

    setFiltered(
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.description || "").toLowerCase().includes(term)
      )
    );
  }

  return (
    <div className="page-wrap">
      <div className="container mt-4 content-card">

        <div className="d-flex align-items-center mb-3">
          <h2 className="me-auto page-title">Products</h2>
        </div>

        {/* SEARCH + ADD BUTTON */}
        <Row className="align-items-center mb-3">
          <Col md={7}>
            <InputGroup>
              <FormControl
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button className="btn-search" onClick={handleSearch}>
                Search
              </Button>
            </InputGroup>
          </Col>

          <Col md={5} className="text-end">
            <Button className="btn-add" onClick={openAdd}>
              + Add Product
            </Button>
          </Col>
        </Row>

        {/* PRODUCT TABLE */}
        <Table bordered hover responsive>
          <thead>
            <tr>
              <th style={{ width: "140px" }}>Image</th>
              <th>Name</th>
              <th>Description</th>
              <th style={{ width: "120px" }}>Price</th>
              <th style={{ width: "160px" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="5" className="text-center">No products found</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.image_path ? (
                      <img
                        src={supabase.storage.from(BUCKET).getPublicUrl(p.image_path).data.publicUrl}
                        style={{ width: "70px", borderRadius: "6px" }}
                      />
                    ) : "No Image"}
                  </td>

                  <td>{p.name}</td>
                  <td>{p.description}</td>
                  <td>₹{p.price}</td>

                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Button className="btn-edit" size="sm" onClick={() => openEdit(p)}>
                        Edit
                      </Button>
                      <Button className="btn-delete" size="sm" onClick={() => deleteProduct(p.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="modal fade show d-block custom-modal-overlay">
          <div className="modal-dialog modal-lg">
            <div className="modal-content shadow custom-modal-content">

              <div className="modal-header custom-modal-header">
                <h5 className="modal-title">{mode === "add" ? "Add Product" : "Edit Product"}</h5>
                <button type="button" className="btn-close" onClick={closeForm}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body custom-modal-body">
                  <Row>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Product Name</Form.Label>
                        <Form.Control name="name" value={form.name} onChange={handleChange} required />
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Price</Form.Label>
                        <Form.Control name="price" value={form.price} onChange={handleChange} required />
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Image</Form.Label>
                        <Form.Control ref={fileRef} type="file" accept="image/*" />
                      </Form.Group>

                      {form.image_path && (
                        <img
                          src={supabase.storage.from(BUCKET).getPublicUrl(form.image_path).data.publicUrl}
                          className="mt-2"
                          style={{ width: "80px", borderRadius: "6px" }}
                        />
                      )}
                    </Col>

                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Description</Form.Label>
                        <Form.Control name="description" value={form.description} onChange={handleChange} />
                      </Form.Group>
                    </Col>

                  </Row>
                </div>

                <div className="modal-footer custom-modal-footer">
                  <button type="submit" className="btn btn-primary">
                    {mode === "add" ? "Save" : "Update"}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeForm}>
                    Cancel
                  </button>
                </div>

              </form>

            </div>
          </div>
        </div>
      )}

      {/* STYLES — SAME AS COURSE PAGE */}
      <style jsx>{`
        .page-wrap { background: #f3f6f9; padding: 12px 18px; }
        .content-card { background: white; border-radius: 6px; padding: 22px; box-shadow: 0 1px 2px rgba(0,0,0,.05); }
        .page-title { font-weight: 600; }
        .btn-add { background: #28a745; color: white; border: none; }
        .btn-search { background: linear-gradient(90deg,#6f42ff,#8b5cf6); color: white; }
        .btn-edit { background: #ffb000; color: white; border: none; }
        .btn-delete { background: #e53e3e; color: white; border: none; }
        .custom-modal-overlay { background: rgba(0,0,0,.35); position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; }
        .custom-modal-content { border-radius: 8px; }
      `}</style>
    </div>
  );
}
