const SoothingGradient = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 via-background to-primary/10" />
      
      {/* Animated floating orbs */}
      <div 
        className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-gradient-to-br from-secondary/40 to-transparent blur-3xl animate-pulse"
        style={{ animationDuration: '4s' }}
      />
      <div 
        className="absolute top-1/2 -right-20 w-96 h-96 rounded-full bg-gradient-to-bl from-primary/15 to-transparent blur-3xl animate-pulse"
        style={{ animationDuration: '6s', animationDelay: '1s' }}
      />
      <div 
        className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-gradient-to-t from-accent/30 to-transparent blur-3xl animate-pulse"
        style={{ animationDuration: '5s', animationDelay: '2s' }}
      />
      
      {/* Subtle grain overlay */}
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4xIi8+PC9zdmc+')]" />
    </div>
  );
};

export default SoothingGradient;
