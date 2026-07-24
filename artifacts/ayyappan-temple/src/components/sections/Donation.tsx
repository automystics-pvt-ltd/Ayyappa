import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainer } from '@/lib/animations';
import { Building, CreditCard, HeartHandshake, QrCode, ShieldCheck } from 'lucide-react';

const amounts = [501, 1001, 5001, 10001];

export function Donation() {
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom' | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  return (
    <section id="donate" className="py-24 bg-background relative">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpVariant}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <HeartHandshake className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6">
            நிதி பங்களிப்பு
          </h2>
          <div className="bg-secondary/20 border border-secondary/40 rounded-full px-6 py-3 inline-block">
            <p className="text-lg md:text-xl text-foreground font-serif italic font-medium">
              "கோவில் கட்டும் பாக்கியம் எல்லோருக்கும் கிடைப்பதில்லை."
            </p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Amount Selection */}
          <motion.div 
            className="lg:col-span-7 space-y-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUpVariant} className="bg-card border border-card-border rounded-2xl p-6 md:p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-foreground mb-6">தங்கள் நன்கொடையை தேர்ந்தெடுக்கவும்</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {amounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setSelectedAmount(amt)}
                    className={`py-4 rounded-xl border-2 text-lg font-bold transition-all ${
                      selectedAmount === amt 
                        ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                        : 'border-border hover:border-primary/50 text-foreground bg-background'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-xl font-bold text-muted-foreground">₹</span>
                </div>
                <input
                  type="number"
                  placeholder="பிற தொகை (Custom Amount)"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount('custom');
                  }}
                  onFocus={() => setSelectedAmount('custom')}
                  className={`w-full pl-10 pr-4 py-4 rounded-xl border-2 text-lg font-bold outline-none transition-all ${
                    selectedAmount === 'custom'
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border focus:border-primary/50 text-foreground bg-background'
                  }`}
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-800 font-medium">
                  தாங்கள் வழங்கும் ஒவ்வொரு ரூபாயும் ஆலய திருப்பணிக்காக மட்டுமே பயன்படுத்தப்படும்.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Payment Details */}
          <motion.div 
            className="lg:col-span-5 space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Bank Details */}
            <motion.div variants={fadeUpVariant} className="bg-card border border-card-border rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Building className="w-24 h-24" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                வங்கி விவரங்கள்
              </h4>
              <div className="space-y-4">
                {[
                  { label: 'வங்கி பெயர்', val: 'விவரங்கள் பின்னர் சேர்க்கப்படும்' },
                  { label: 'கணக்கு பெயர்', val: 'விவரங்கள் பின்னர் சேர்க்கப்படும்' },
                  { label: 'கணக்கு எண்', val: 'விவரங்கள் பின்னர் சேர்க்கப்படும்' },
                  { label: 'IFSC', val: 'விவரங்கள் பின்னர் சேர்க்கப்படும்' },
                  { label: 'UPI ID', val: 'விவரங்கள் பின்னர் சேர்க்கப்படும்' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-0.5 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{item.label}</span>
                    <span className="text-foreground font-bold text-sm italic">{item.val}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* QR Code */}
            <motion.div variants={fadeUpVariant} className="bg-card border border-card-border rounded-2xl p-6 shadow-md text-center">
              <h4 className="text-xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                UPI Payment
              </h4>
              <div className="bg-muted w-48 h-48 mx-auto rounded-xl flex items-center justify-center mb-4 border border-border">
                <QrCode className="w-24 h-24 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground font-medium">
                QR Code Scan செய்து எளிதாக நன்கொடை வழங்கலாம்
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
