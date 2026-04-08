export default function MessagingInterface() {
  return (
    <main className="pt-20 h-[calc(100vh-80px)] flex overflow-hidden max-w-7xl mx-auto w-full">
      {/* Conversation List Panel (Split Pane Left) */}
      <aside className="w-full md:w-[400px] border-r border-transparent bg-surface-container-low flex flex-col z-10">
        {/* Search & Filter Area */}
        <div className="p-6 space-y-6">
          <h1 className="font-headline text-3xl text-primary italic">Messages</h1>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">search</span>
            <input className="w-full bg-surface-container-lowest border-none rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-outline-variant transition-all shadow-sm" placeholder="Search conversations..." type="text" />
          </div>
        </div>
        
        {/* List of Contacts */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-6">
          <div className="space-y-1">
            {/* Active Item */}
            <div className="relative flex items-center gap-4 p-4 rounded-xl bg-surface-container-lowest shadow-sm cursor-pointer group transition-all">
              <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full"></div>
              <div className="relative flex-shrink-0">
                <img className="w-14 h-14 rounded-full object-cover" alt="Malek Ben Achour" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSshQQpUg2QqerGMmLBZ_ZcoxoKuCvDCOxqt63BpWMUTm_tW5I7tkT7tyBpMmBRaFdxXUG5yGNb3J9T_hca_CJk1k7djHRsDRUk2cm8ILsVgffEm65MqbyF9trmT3EXN6gQu1xnDsVYP3UenCozRD-8vsAq7Jq1C0tBQHNW8Itn_BCEOO5rCCzvbqpzKqlQRSCTVqNDganINWXM87xZjthuWlEH4eXsCNFakxD9HZgWCW657ufUMSBsWm6xO2DGwzvO6PImGdmcfQ" />
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-on-surface truncate">Malek Ben Achour</h3>
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">2m ago</span>
                </div>
                <p className="text-sm text-on-surface-variant truncate font-medium">The artisan in the Medina confirmed the...</p>
              </div>
            </div>
            
            {/* Inactive Item */}
            <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container-high transition-all cursor-pointer group">
              <div className="relative flex-shrink-0">
                <img className="w-14 h-14 rounded-full object-cover grayscale-[0.2]" alt="Sarah Miller" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXR605I7uv6QnzxW7ZquN_HaaPfTNi53QuhktFv_zGY3jtDAfj0lP2o5hx28o8N8iLa2Qp803ol1U9_yaYmXPTUcZXv9yTjRaUsdsMDZtTYlft4Wz0l9M5e_8YpQesGPKsx7xIRl4oJ2JNf_A-akP5KjgkliaUnnUa-sDKoYZt4RBsjRjuX9KnPZZwPPXIVonsn0VjaVQzsPdbaXVLRK54BF3UNiCpJIg2VfmjjyVV-TpDesmpmo5kyBzsEtNmYnkg99QGfDxu-qI" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-on-surface truncate opacity-90 group-hover:opacity-100">Sarah Miller</h3>
                  <span className="text-[11px] text-outline uppercase tracking-wider">Yesterday</span>
                </div>
                <p className="text-sm text-outline truncate">That tour of Carthage was absolutely breathtaking.</p>
              </div>
            </div>
            
            {/* Inactive Item */}
            <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container-high transition-all cursor-pointer group">
              <div className="relative flex-shrink-0">
                <img className="w-14 h-14 rounded-full object-cover grayscale-[0.2]" alt="Yassine Dridi" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvDtYPduIDkSe0au8CtlECAg7NA-FvIzbJXDuMPBBdd5bh8jiWL3PGiaWJ5iX-XqBb0rYf5N1qc-l3lGFrRsd7jwHuCG4CqrzAAGWUwYbn3IXXx8YCel78rzz7gdmTxL0NNm6ifWaiS7_XBqOXgUL7-lvkfTtSkl4z6oiiOKL3glzg3miAVpT7NrJ69qVKNrG6ETQ3ItIlOrblmODR56wRTgyyefJdUFuUkR_h0JZ4wCHhbrP-anqmhS3bweOWqOnOnuAy9cOJFx0" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-on-surface truncate opacity-90 group-hover:opacity-100">Yassine Dridi</h3>
                  <span className="text-[11px] text-outline uppercase tracking-wider">Aug 12</span>
                </div>
                <p className="text-sm text-outline truncate">Checking on the reservation for the Dar Sebastien.</p>
              </div>
            </div>
            
            {/* Inactive Item */}
            <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container-high transition-all cursor-pointer group">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-lg">EH</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-on-surface truncate opacity-90 group-hover:opacity-100">Elena H.</h3>
                  <span className="text-[11px] text-outline uppercase tracking-wider">Aug 10</span>
                </div>
                <p className="text-sm text-outline truncate">The sunset from Sidi Bou Said was perfect.</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Active Chat Screen (Split Pane Right) */}
      <section className="hidden md:flex flex-1 flex-col relative bg-surface">
        {/* Subtle Arabesque Overlay */}
        <div className="absolute inset-0 arabesque-pattern pointer-events-none"></div>
        
        {/* Chat Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-surface-container-low/50 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img className="w-10 h-10 rounded-full object-cover shadow-sm" alt="Malek Ben Achour" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFUKjPm1T7T1I4Ex7nNvFU5nBUKPORqCth_rIl72Unuz7GWdC9evAULB6vTlzSvHVu8JW5NYi4dcU5JmEcy6mqXKKpx5DkizGSXhcliPgNPTKMAq9iLErG9Y-0aBDwbFYpTjBnFUDCrtRd-o7W93dbVD_jyjfmssG2l3qmCxYItT2_nnWYJMkypei2ipqclxeCXpFV1IXoHmJkWlCxZwJv9ksHUZR0roGwXXpdDzmJLy-s9CuwZ0iS3ytTdO-qX2B6RVizWHI9nBI" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-surface-container-low rounded-full"></span>
            </div>
            <div>
              <h2 className="font-headline text-lg leading-tight">Malek Ben Achour</h2>
              <span className="text-[11px] font-bold text-green-600 uppercase tracking-widest">Online Now</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors material-symbols-outlined text-outline">videocam</button>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors material-symbols-outlined text-outline">call</button>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors material-symbols-outlined text-outline">info</button>
          </div>
        </header>
        
        {/* Message Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative z-10">
          {/* Date Divider */}
          <div className="flex justify-center">
            <span className="px-4 py-1 rounded-full bg-surface-container-high text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Today</span>
          </div>
          
          {/* Recipient Message */}
          <div className="flex gap-4 max-w-[80%]">
            <img className="w-8 h-8 rounded-full flex-shrink-0 self-end shadow-sm" alt="Sender" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjnlwC4xfTrTSWM5E4aQJrkbvdqDTwYpa96oIKBeKGoP1Nx_H_Uf5I1xcpdsb51OIKdDm1JwP435ZzF6ezP-pDtHk9t4LaAbRs78qLzU9w_9XDYptsEGyWKEi-8JmPhVDKqXrCyMKmtxn_UVTFLc_AcMvxL-uA_n3hzs-dtysxPa8KlIwP2MdvsCbDl9a-fW9u4woK4ClkkuBC-UsM_f_JY4iUMDhQmpS4AEtxJzGSTHCLaGxs28PMMP-B5dRTCqp5qE1FUFpbkOE" />
            <div className="space-y-1">
              <div className="bg-surface-container-lowest p-4 rounded-2xl rounded-bl-none shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-on-surface text-sm leading-relaxed">
                Hello! I just spoke with the rug weaver in Kairouan. He has the indigo dye patterns ready for your collection.
              </div>
              <span className="text-[10px] text-outline px-1">14:18</span>
            </div>
          </div>
          
          {/* User Message */}
          <div className="flex flex-row-reverse gap-4 max-w-[80%] ml-auto">
            <div className="space-y-1 items-end flex flex-col">
              <div className="bg-gradient-to-br from-primary to-primary-container p-4 rounded-2xl rounded-br-none shadow-md text-on-primary text-sm leading-relaxed">
                That is excellent news, Malek. Did he mention if the heritage wool is back in stock?
              </div>
              <div className="flex items-center gap-1.5 px-1">
                <span className="text-[10px] text-outline">14:22</span>
                <span className="material-symbols-outlined text-primary text-xs">done_all</span>
              </div>
            </div>
          </div>
          
          {/* Recipient Message with Image */}
          <div className="flex gap-4 max-w-[80%]">
            <img className="w-8 h-8 rounded-full flex-shrink-0 self-end shadow-sm" alt="Sender" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjY0QlPeugP3r9WJX6mrs_Ivo-zfMVFVgCamGhois7VQp5-C9qqhpTgixPIpwVo03ZxxJxzrADzR6FEeuTq0g2HKqTwrjqDoVdo_q1brMrupta7SRSpz9_JzmdSGoXwd_XDYY2gWhN9D3Xvq7hSwpVmpLpbqxidLpeVcFekr5VpdEqvfy0PGGz9W7nLp2gqT81knzRWm0kroaRCspKl321eJSrf054oY9wn19DG5wqf0t_Q8V0YLckOveY7s_bbYW3G1z3Dw4ltPw" />
            <div className="space-y-3">
              <div className="bg-surface-container-lowest p-2 rounded-2xl rounded-bl-none shadow-[0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden">
                <img className="rounded-xl w-full h-48 object-cover" alt="Tiles" src="https://st2.depositphotos.com/3575669/6592/i/950/depositphotos_65923815-stock-photo-traditional-floral-tiles-in-tunisia.jpg" />
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-2xl rounded-bl-none shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-on-surface text-sm leading-relaxed">
                He did! Here is a sample of the new pattern. The artisan in the Medina confirmed the quality is even better than last year.
              </div>
              <span className="text-[10px] text-outline px-1">14:25</span>
            </div>
          </div>
          
          {/* User Message (Typing...) */}
          <div className="flex flex-row-reverse gap-4 max-w-[80%] ml-auto">
            <div className="flex gap-1.5 p-3 rounded-2xl bg-secondary-container/30 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "-0.15s" }}></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "-0.3s" }}></div>
            </div>
          </div>
        </div>
        
        {/* Chat Input Bar */}
        <footer className="p-6 bg-surface z-20">
          <div className="max-w-4xl mx-auto flex items-center gap-4 bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/10 p-2 pl-4 rounded-full shadow-lg">
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors material-symbols-outlined text-outline">attach_file</button>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors material-symbols-outlined text-outline">sentiment_satisfied</button>
            <input className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-outline-variant py-2" placeholder="Share your thoughts..." type="text" />
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-on-primary shadow-lg hover:scale-105 transition-transform active:scale-95">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </div>
          <p className="text-[10px] text-center mt-3 text-outline-variant font-medium uppercase tracking-[0.2em]">Encrypted Cultural Exchange</p>
        </footer>
      </section>

      {/* Empty State / Mobile Placeholder (only if no chat selected) */}
      <section className="md:hidden flex-1 flex items-center justify-center p-8 text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-surface-container-high rounded-full mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-outline-variant">forum</span>
          </div>
          <h3 className="font-headline text-xl italic text-primary">Your Tunis Conversations</h3>
          <p className="text-sm text-outline max-w-xs">Connect with local curators and artisans to personalize your heritage journey.</p>
          <button className="mt-4 px-8 py-3 bg-primary text-on-primary rounded-full text-sm font-bold shadow-md uppercase tracking-wider">Start a Chat</button>
        </div>
      </section>
    </main>
  );
}
