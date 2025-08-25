const Index = () => {
  console.log("Index component rendering...");
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#ff0000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        zIndex: 9999
      }}
    >
      <h1 style={{
        color: '#ffffff',
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px'
      }}>
        FITS APP TEST
      </h1>
      <p style={{
        color: '#ffffff',
        fontSize: '16px'
      }}>
        If you can see this red screen, React is working!
      </p>
    </div>
  );
};

export default Index;
