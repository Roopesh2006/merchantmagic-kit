import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '../integrations/supabase/client'

// Define the expected props for InputField
interface InputFieldProps {
  label: string;
  value: string;
  setValue: (value: string) => void;
  type?: string;
  step?: string;
  placeholder?: string;
  required?: boolean;
}

function InputField({ label, value, setValue, type = "text", step, placeholder, required = true }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-slate-900 h-10"
        required={required}
      />
    </div>
  )
}

// Define the expected props for SubmitButton
interface SubmitButtonProps {
  label: string;
  isSubmitting: boolean;
  className?: string;
}

function SubmitButton({ label, isSubmitting, className = "from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700" }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={`w-full bg-gradient-to-r text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-md mt-4 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isSubmitting ? 'Processing...' : label}
    </button>
  )
}

function PlatformAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')

  // Shop State
  const [shopName, setShopName] = useState('')
  const [shopSlug, setShopSlug] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [isSubmittingShop, setIsSubmittingShop] = useState(false)

  // Product State
  const [productShopId, setProductShopId] = useState('')
  const [productName, setProductName] = useState('')
  const [productSlug, setProductSlug] = useState('')
  const [productDesc, setProductDesc] = useState('')
  const [productRate, setProductRate] = useState('')
  const [productOriginalPrice, setProductOriginalPrice] = useState('')
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false)

  // Offer State
  const [offerProductId, setOfferProductId] = useState('')
  const [discountPrice, setDiscountPrice] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [bannerUrl1, setBannerUrl1] = useState('')
  const [bannerUrl2, setBannerUrl2] = useState('')
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const masterKey = import.meta.env.VITE_ADMIN_MASTER_KEY || 'admin123'
    if (password === masterKey) {
      setIsAuthenticated(true)
    } else {
      alert('Invalid Master Password')
    }
  }

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingShop(true)
    try {
      const { error } = await supabase.from('shop').insert([{
        name: shopName,
        slug: shopSlug,
        shop_phone_number: shopPhone,
      }])
      if (error) throw error
      alert('Shop added successfully!')
      setShopName(''); setShopSlug(''); setShopPhone('');
    } catch (error: any) {
      alert(`Error adding shop: ${error.message}`)
    } finally {
      setIsSubmittingShop(false)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingProduct(true)
    try {
      const { error } = await supabase.from('products').insert([{
        shop_id: productShopId,
        name: productName,
        slug: productSlug,
        description: productDesc,
        rate: parseFloat(productRate),
        original_price: parseFloat(productOriginalPrice),
      }])
      if (error) throw error
      alert('Product added successfully!')
      setProductShopId(''); setProductName(''); setProductSlug('');
      setProductDesc(''); setProductRate(''); setProductOriginalPrice('');
    } catch (error: any) {
      alert(`Error adding product: ${error.message}`)
    } finally {
      setIsSubmittingProduct(false)
    }
  }

  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingOffer(true)
    try {
      const { error } = await supabase.from('offers').insert([{
        product_id: offerProductId,
        discount_price: parseFloat(discountPrice),
        expires_at: expiresAt,
        banner_url_1: bannerUrl1,
        banner_url_2: bannerUrl2,
      }])
      if (error) throw error
      alert('Offer added successfully!')
      setOfferProductId(''); setDiscountPrice(''); setExpiresAt('');
      setBannerUrl1(''); setBannerUrl2('');
    } catch (error: any) {
      alert(`Error adding offer: ${error.message}`)
    } finally {
      setIsSubmittingOffer(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 mb-6 text-center">
            Platform Admin Secure Login
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Master Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                placeholder="Enter root password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md"
            >
              Verify Access
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Platform Admin Dashboard
            </h1>
            <p className="text-slate-400 mt-2">Manage shops, global products, and platform-wide flash sales.</p>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="mt-4 md:mt-0 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-slate-700"
          >
            Lock Session
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1: Add Shop */}
          <section className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Add New Shop</h2>
            <form onSubmit={handleAddShop} className="space-y-4 w-full">
              <InputField label="Shop Name" value={shopName} setValue={setShopName} />
              <InputField label="Slug" value={shopSlug} setValue={setShopSlug} placeholder="my-awesome-shop" />
              <InputField label="Phone Number" value={shopPhone} setValue={setShopPhone} type="tel" />
              <SubmitButton label="Create Shop" isSubmitting={isSubmittingShop} />
            </form>
          </section>

          {/* Card 2: Add Product */}
          <section className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Add New Product</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <InputField label="Shop ID (UUID)" value={productShopId} setValue={setProductShopId} />
              <InputField label="Product Name" value={productName} setValue={setProductName} />
              <InputField label="Product Slug" value={productSlug} setValue={setProductSlug} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-slate-900 resize-none"
                  rows={2}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Rate" value={productRate} setValue={setProductRate} type="number" step="0.01" />
                <InputField label="Original Price" value={productOriginalPrice} setValue={setProductOriginalPrice} type="number" step="0.01" />
              </div>
              <SubmitButton label="Create Product" isSubmitting={isSubmittingProduct} />
            </form>
          </section>

          {/* Card 3: Flash Sale */}
          <section className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Create Flash Sale</h2>
            <form onSubmit={handleAddOffer} className="space-y-4">
              <InputField label="Product ID (UUID)" value={offerProductId} setValue={setOfferProductId} />
              <InputField label="Discount Price" value={discountPrice} setValue={setDiscountPrice} type="number" step="0.01" />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expires At</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white text-slate-900"
                  required
                />
              </div>
              <InputField label="Banner URL 1" value={bannerUrl1} setValue={setBannerUrl1} type="url" />
              <InputField label="Banner URL 2" value={bannerUrl2} setValue={setBannerUrl2} type="url" />
              <SubmitButton label="Launch Flash Sale" isSubmitting={isSubmittingOffer} className="from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" />
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute('/platform-admin')({
  component: PlatformAdmin,
})
