# 🗺️ Google Maps Street View Setup Guide

## Quick Start

### Step 1: Get Your API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select Project**
   - Click "Select a project" → "New Project"
   - Name it: "Iligan Surplus Luxury"
   - Click "Create"

3. **Enable Required APIs**
   - Go to "APIs & Services" → "Library"
   - Search and enable:
     - ✅ **Maps Embed API**
     - ✅ **Street View Static API**

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated key

### Step 2: Add to Your Project

1. **Open `.env` file**
   ```bash
   # In your project root
   nano .env
   ```

2. **Replace the placeholder**
   ```env
   # Find this line:
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY_HERE"
   
   # Replace with your actual key:
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyC-xxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

3. **Save and restart**
   ```bash
   # Stop the dev server (Ctrl+C)
   # Start it again
   npm run dev
   ```

### Step 3: Test It

1. Go to: `http://localhost:3000/map`
2. Search for a merchant or drag the pin
3. Click "Explore 3D"
4. Street View should load! 🎉

---

## 🔒 Security Best Practices

### Restrict Your API Key

1. **Go to Credentials**
   - Find your API key
   - Click "Edit"

2. **Set Application Restrictions**
   ```
   HTTP referrers (web sites)
   
   Add items:
   - localhost:3000/*
   - yourdomain.com/*
   - *.yourdomain.com/*
   ```

3. **Set API Restrictions**
   ```
   Restrict key
   
   Select APIs:
   ☑ Maps Embed API
   ☑ Street View Static API
   ```

4. **Save**

---

## 💰 Pricing

### Free Tier
- **$200 free credit** per month
- Covers ~28,000 Street View loads
- More than enough for most apps

### Street View Pricing
- **$7 per 1,000 loads** (after free tier)
- Dynamic Street View: $14 per 1,000

### Tips to Stay Free
- Use caching
- Implement lazy loading
- Set usage quotas
- Monitor usage in console

---

## 🐛 Common Issues

### Issue: "This page can't load Google Maps correctly"

**Solution 1**: Check API key
```bash
# Verify key is set
echo $NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Should show your key, not placeholder
```

**Solution 2**: Enable APIs
- Maps Embed API ✅
- Street View Static API ✅

**Solution 3**: Check restrictions
- Remove all restrictions temporarily
- Test if it works
- Add restrictions back one by one

### Issue: "Street View not available for this location"

**Reason**: Not all locations have Street View coverage

**Solution**: 
- Try a different location
- Check coverage: https://www.google.com/maps
- Use fallback UI (already implemented)

### Issue: API key visible in browser

**This is normal!** 
- `NEXT_PUBLIC_*` variables are exposed to browser
- That's why we use API restrictions
- Never use server-only keys in frontend

---

## 📊 Monitor Usage

### Check Usage
1. Go to Google Cloud Console
2. Navigate to "APIs & Services" → "Dashboard"
3. View "Maps Embed API" usage
4. Set up billing alerts

### Set Quotas
1. Go to "APIs & Services" → "Quotas"
2. Find "Maps Embed API"
3. Set daily limit (e.g., 1,000 requests/day)
4. Save

---

## 🔄 Alternative: Free Options

If you don't want to use Google Maps:

### Option 1: OpenStreetMap
```tsx
// No API key needed
<iframe
  src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`}
/>
```

### Option 2: Mapbox
```tsx
// Free tier: 50,000 loads/month
<iframe
  src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11.html?access_token=${MAPBOX_TOKEN}#15/${lat}/${lng}`}
/>
```

### Option 3: Static Image
```tsx
// Just show a static map image
<img
  src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x400&key=${API_KEY}`}
/>
```

---

## ✅ Checklist

Setup:
- [ ] Created Google Cloud project
- [ ] Enabled Maps Embed API
- [ ] Enabled Street View Static API
- [ ] Created API key
- [ ] Added key to `.env`
- [ ] Restarted dev server

Security:
- [ ] Set HTTP referrer restrictions
- [ ] Set API restrictions
- [ ] Enabled billing alerts
- [ ] Set usage quotas

Testing:
- [ ] Street View loads
- [ ] Fallback UI works
- [ ] Mobile responsive
- [ ] No console errors

---

## 📚 Resources

- [Google Maps Platform](https://developers.google.com/maps)
- [Maps Embed API Docs](https://developers.google.com/maps/documentation/embed)
- [Street View API Docs](https://developers.google.com/maps/documentation/streetview)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)

---

## 🎉 You're Done!

Your map now has:
- ✅ Interactive Street View
- ✅ Secure API key setup
- ✅ Fallback UI for errors
- ✅ Free tier optimization

Enjoy exploring! 🗺️
