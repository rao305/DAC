# Testing the B2B UI Implementation

## 🚀 Quick Start

```bash
cd frontend
npm run dev
```

Then visit `http://localhost:3000` in your browser.

---

## ✅ Testing Checklist

### 1. Product Page (`/product`)
- [ ] Hero gradient glow animates smoothly
- [ ] Trust marquee scrolls automatically
- [ ] "How It Works" 3-step flow staggers in
- [ ] Feature cards have hover lift effect
- [ ] Icons "breathe" (subtle scale)
- [ ] Sticky CTA bar hides on scroll down, shows on scroll up

### 2. Use Cases Page (`/use-cases`)
- [ ] 4 tabs switch smoothly (Support, Knowledge, Analytics, Code)
- [ ] Support tab shows animated line chart
- [ ] "See a live example" opens API Playground modal
- [ ] Benefit cards stagger in on tab switch
- [ ] Icons animate on hover

### 3. Pricing Page (`/pricing`)
- [ ] Monthly/Annual toggle works
- [ ] Prices update when toggle changes
- [ ] "Most Popular" badge on Pro plan
- [ ] "Compare plans" accordion expands
- [ ] FAQ accordion works
- [ ] Cards have hover lift effect

### 4. Docs Page (`/docs`)
- [ ] SDK code tabs switch (TypeScript/Python/cURL)
- [ ] Copy button shows "Copied!" animation
- [ ] "Try the Chat API" opens playground
- [ ] Search filters documentation cards
- [ ] Doc cards animate on hover

### 5. API Playground (Modal)
- [ ] Opens from "Try the Chat API" button
- [ ] Model dropdown works
- [ ] Temperature slider updates value
- [ ] "Run Request" shows loading state
- [ ] Response displays with simulated streaming
- [ ] Token and latency counters animate

### 6. Global Components

#### Header
- [ ] "Start Chat" CTA links to `/conversations`
- [ ] Mobile menu opens/closes
- [ ] All navigation links work
- [ ] Pricing button navigates correctly

#### Footer
- [ ] "Open Chat" CTA prominent and functional
- [ ] All footer links navigate correctly
- [ ] Social icons have hover states
- [ ] Layout responsive on mobile

#### Sticky CTA Bar
- [ ] Appears after scrolling 100px
- [ ] Hides when scrolling down
- [ ] Shows when scrolling up
- [ ] "Start Chat" and "Pricing" links work

---

## 🎨 Motion Testing

### Desktop
1. **Scroll through Product page** - all sections should reveal smoothly
2. **Hover over feature cards** - lift + shadow effect
3. **Watch counters** - should animate on first scroll into view
4. **Tab through Use Cases** - each tab should re-trigger animations

### Mobile
1. **Check marquee** - should be static grid, not scrolling
2. **Test mobile menu** - smooth open/close
3. **Verify touch interactions** - tabs, accordions, toggles

### Reduced Motion
1. Open Chrome DevTools
2. Press `Cmd+Shift+P` → "Show Rendering"
3. Enable "Emulate CSS prefers-reduced-motion"
4. Refresh page → animations should be instant opacity changes

---

## 🔍 Performance Testing

### Lighthouse Audit
```bash
# From frontend directory
npm run lh:ci
```

**Expected Scores:**
- Performance: ≥95
- Accessibility: ≥95
- Best Practices: ≥95
- SEO: 100

### Visual Regression
1. Take screenshots of all pages
2. Compare with previous version
3. Verify no layout shifts (CLS < 0.05)

---

## 🐛 Common Issues & Fixes

### Issue: Framer Motion not animating
**Fix**: Check browser console for errors. Ensure `framer-motion` is installed:
```bash
npm install --legacy-peer-deps
```

### Issue: Marquee not scrolling
**Fix**: Check CSS animation is applied:
```css
.animate-marquee {
  animation: marquee 20s linear infinite;
}
```

### Issue: Sticky CTA bar not appearing
**Fix**: Scroll down past 100px. If still not visible, check z-index conflicts.

### Issue: API Playground not opening
**Fix**: Check Dialog component is imported from `@/components/ui/dialog`.

---

## 📱 Browser Testing

### Desktop
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

### Mobile
- ✅ iOS Safari 17+
- ✅ Chrome Android 120+
- ✅ Samsung Internet 23+

---

## 🎯 Key Features to Demo

1. **Trust Signals**: Point out 99.9% uptime, 200ms TTFT, SOC 2 badge
2. **Motion Polish**: Scroll through Product page to show reveals
3. **Use Case Tabs**: Switch between tabs to show mini dashboards
4. **API Playground**: Demo live interaction with fake streaming
5. **Pricing Toggle**: Show monthly vs annual savings
6. **Comparison Table**: Expand to show detailed feature matrix
7. **SDK Code Tabs**: Copy code snippet to clipboard
8. **Sticky CTA**: Scroll to show hide/reveal behavior

---

## 🚦 Acceptance Sign-Off

Once all checklist items pass:

1. ✅ All pages render without errors
2. ✅ All animations respect reduced-motion
3. ✅ Lighthouse scores ≥95
4. ✅ Mobile responsive (test on real device if possible)
5. ✅ No console errors or warnings
6. ✅ All CTAs link to correct destinations

---

## 📞 Support

If you encounter any issues:

1. Check `npm install --legacy-peer-deps` completed successfully
2. Verify Node.js version ≥18
3. Clear `.next` cache: `rm -rf .next && npm run dev`
4. Check browser console for specific error messages

---

**Happy Testing! 🎉**

All components are production-ready and follow Next.js 16 + React 19 best practices.

