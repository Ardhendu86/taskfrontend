import axios from "axios";
import Select from "react-select";
import { useEffect, useState } from "react";

function App() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showProductGallery, setShowProductGallery] = useState(false);
  const [productGalleryImages, setProductGalleryImages] = useState([]);
  const [productGalleryTitle, setProductGalleryTitle] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [existingImages, setExistingImages] = useState([]);

  const [form, setForm] = useState({
    name: "",
    category_id: [],
    images: [],
    oldImages: []
  });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/categories`);
      setCategories(res.data);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch categories`);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products`);
      setProducts(res.data);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch products`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();
      data.append("name", form.name);
      form.category_id.forEach((id) => {
        data.append("category_id", id);
      });

      if (editingId) {
        data.append("existing_images", JSON.stringify(existingImages));
      }

      for (let i = 0; i < form.images.length; i++) {
        data.append("images", form.images[i]);
      }

      if (editingId) {
        await axios.put(`${API_URL}/api/product/${editingId}`, data);
      } else {
        await axios.post(`${API_URL}/api/product`, data);
      }

      setForm({ name: "", category_id: [], images: [] });
      setEditingId(null);
      setExistingImages([]);
      setFileInputKey((prev) => prev + 1);
      fetchProducts();
    } catch (err) {
      setError("Failed to save product");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await axios.delete(`${API_URL}/api/product/${id}`);
      fetchProducts();
      setError(null);
    } catch (err) {
      setError(`Failed to delete product: ${err.response?.status || 'Error'}`);
    }
  };

  const handleEdit = (product) => {
    const selectedCategoryIds = Array.isArray(product.category_ids) && product.category_ids.length > 0
      ? product.category_ids.map((cat) => cat._id)
      : product.category_id?._id
        ? [product.category_id._id]
        : [];

    setForm({
      ...form,
      oldImages: product.images || [],
      name: product.name,
      category_id: selectedCategoryIds,
      images: []
    });
    setExistingImages(product.images || []);
    setFileInputKey((prev) => prev + 1);
    setEditingId(product._id);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setForm({ ...form, images: selectedFiles });
  };

  const removeSelectedImage = (indexToRemove) => {
    setForm({
      ...form,
      images: form.images.filter((_, index) => index !== indexToRemove)
    });
  };

  const removeExistingImage = (indexToRemove) => {
    setExistingImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const openProductGallery = (productName, images) => {
    setProductGalleryTitle(productName);
    setProductGalleryImages(images || []);
    setShowProductGallery(true);
  };

  const splitImagesIntoColumns = (images, columnCount = 3) => {
    const columns = Array.from({ length: columnCount }, () => []);

    images.forEach((img, index) => {
      columns[index % columnCount].push(img);
    });

    return columns;
  };

  return (
    <div className="app-container">
      <nav className="navbar navbar-dark bg-primary mb-5">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">Product Management</span>
        </div>
      </nav>

      <div className="container">
        {error && (
          <div className="alert alert-danger mb-4">
            {error}
          </div>
        )}

        <div className="row mb-5">
          <div className="col-lg-6 mx-auto">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-primary text-white">
                <h3 className="mb-0">
                  {editingId ? "Edit Product" : "Add New Product"}
                </h3>
              </div>

              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <Select
                      isMulti
                      name="categories"
                      options={categories.map((cat) => ({
                        value: cat._id,
                        label: cat.name,
                      }))}
                      className="basic-multi-select"
                      classNamePrefix="select"
                      onChange={(selectedOptions) =>
                        setForm({
                          ...form,
                          category_id: selectedOptions
                            ? selectedOptions.map((opt) => opt.value)
                            : [],
                        })
                      }
                      value={categories
                        .filter((cat) => form.category_id?.includes(cat._id))
                        .map((cat) => ({
                          value: cat._id,
                          label: cat.name,
                        }))
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Product Name"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      required
                    />
                  </div>


                  <div className="mb-3">
                    <input
                      key={fileInputKey}
                      type="file"
                      multiple
                      className="form-control"
                      onChange={handleFileChange}
                    />

                    {form.images.length > 0 && (
                      <div className="mt-2 d-flex flex-wrap gap-2">
                        {form.images.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="position-relative border rounded p-1 bg-white"
                            style={{ width: "88px", height: "88px" }}
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-danger position-absolute top-0 end-0"
                              style={{ transform: "translate(30%, -30%)", lineHeight: 1, padding: "0.1rem 0.35rem" }}
                              onClick={() => removeSelectedImage(index)}
                            >
                              x
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {editingId && existingImages.length > 0 && (
                      <div className="mt-3">
                        <small className="text-muted d-block mb-2">Current images</small>
                        <div className="d-flex flex-wrap gap-2">
                          {existingImages.map((img, index) => (
                            <div
                              key={`${img}-${index}`}
                              className="position-relative border rounded p-1 bg-white"
                              style={{ width: "88px", height: "88px" }}
                            >
                              <img
                                src={`${API_URL}/uploads/${img}`}
                                alt="current product"
                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-danger position-absolute top-0 end-0"
                                style={{ transform: "translate(30%, -30%)", lineHeight: 1, padding: "0.1rem 0.35rem" }}
                                onClick={() => removeExistingImage(index)}
                              >
                                x
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary w-100">
                    {editingId ? "Update Product" : "Add Product"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-5">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-primary text-white">
                <h3 className="mb-0">Product List</h3>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Images</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {products && products.length > 0 ? (
                        products.map((p) => (
                          <tr key={p._id}>
                            <td>{p.name}</td>

                            <td>
                              {Array.isArray(p.category_ids) && p.category_ids.length > 0
                                ? p.category_ids.map((cat) => cat.name).join(", ")
                                : p.category_id?.name || "-"}
                            </td>

                            <td>
                              {p.images?.length > 0 ? (
                                <div className="d-flex align-items-center gap-2">
                                  <img
                                    src={`${API_URL}/uploads/${p.images[0]}`}
                                    width="50"
                                    height="50"
                                    alt="product"
                                    style={{
                                      objectFit: "cover",
                                      borderRadius: "4px",
                                    }}
                                  />

                                  {p.images.length > 1 && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-secondary"
                                      onClick={() => openProductGallery(p.name, p.images)}
                                    >
                                      +{p.images.length - 1}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span>No Image</span>
                              )}
                            </td>

                            <td>
                              <button
                                className="btn btn-sm btn-warning me-2"
                                onClick={() => handleEdit(p)}
                              >
                                Edit
                              </button>

                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(p._id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-4">
                            No products found.
                          </td>
                        </tr>
                      )}
                    </tbody>

                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {showProductGallery && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 2000 }}
          onClick={() => setShowProductGallery(false)}
        >
          <div
            className="bg-white rounded shadow p-3"
            style={{ width: "90%", maxWidth: "900px", maxHeight: "80vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">{productGalleryTitle} Images</h5>
              <button type="button" className="btn-close" onClick={() => setShowProductGallery(false)} />
            </div>

            <div className="row mx-0 g-2 p-1">
              {splitImagesIntoColumns(productGalleryImages, 3).map((columnImages, columnIndex) => (
                <div key={`gallery-column-${columnIndex}`} className="col-lg-4 col-md-4 col-6 px-1">
                  {columnImages.map((img, index) => (
                    <img
                      key={`${img}-${index}`}
                      src={`${API_URL}/uploads/${img}`}
                      className="w-100 shadow-sm rounded mb-2"
                      style={{ height: "88px", objectFit: "contain", backgroundColor: "#fff" }}
                      alt="product preview"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default App;