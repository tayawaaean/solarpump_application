import { useEffect, useState } from 'react';
import {
  Box, Drawer, Toolbar, AppBar, Typography, IconButton, CssBaseline, Card, CardContent,
  Grid, useTheme, CircularProgress, Switch, FormControlLabel,TextField, Fade, ButtonGroup, Button,
  Tooltip as MuiTooltip, useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import OpacityIcon from '@mui/icons-material/Opacity';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SpeedIcon from '@mui/icons-material/Speed';
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';
import FilterHdrIcon from '@mui/icons-material/FilterHdr';
import WaterIcon from '@mui/icons-material/Water';
import SavingsIcon from '@mui/icons-material/Savings';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import API from '../api';
import { useMqtt } from '../mqtt';
import Sidebar from '../components/Sidebar';

import {
  Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const drawerWidth = 220;

function updateSeries(series, newValue, maxLen = 20) {
  const next = [...series, newValue];
  if (next.length > maxLen) next.shift();
  return next;
}

const PUMP_LABELS = {
  gasoline: 'Gasoline Pump',
  diesel: 'Diesel Pump',
  ac: 'AC Pump'
};

const PUMP_COLORS = {
  gasoline: "#ef5350",
  diesel: "#8d6e63",
  ac: "#42a5f5"
};

export default function DashboardPage() {
  // State
  const [mobileOpen, setMobileOpen] = useState(false);
  const [series, setSeries] = useState({
    voltage: Array(20).fill(0),
    current: Array(20).fill(0),
    power: Array(20).fill(0),
    waterflow: Array(20).fill(0)
  });
  const [accumulatedEnergy, setAccumulatedEnergy] = useState(0);
  const [waterPumped, setWaterPumped] = useState(0);
  const [energyBase, setEnergyBase] = useState(null);
  const [waterBase, setWaterBase] = useState(null);
  const [currentDay, setCurrentDay] = useState(() => new Date().toDateString());
  const [loading, setLoading] = useState(false);
  const [pumpOn, setPumpOn] = useState(false);
  const [lastRealtime, setLastRealtime] = useState("N/A");

  // Savings animation state
  const [savingsType, setSavingsType] = useState('gasoline');
  const [fadeIn, setFadeIn] = useState(true);

  // All savings values
  const [savingsValues, setSavingsValues] = useState({
    gasoline: 0,
    diesel: 0,
    ac: 0
  });

  // Fuel & electricity price state
  const [fuelPrices, setFuelPrices] = useState({ gasoline: null, diesel: null, ac: null });
  const [fuelLoading, setFuelLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editPrices, setEditPrices] = useState({ gasoline: '', diesel: '', ac: '' });
  const [fuelError, setFuelError] = useState('');

  // Currency state
  const [usdToPhp, setUsdToPhp] = useState(57);
  const [currencyLoading, setCurrencyLoading] = useState(true);

  const [darkMode, setDarkMode] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  // MQTT Hook
  const { lastMessage, isConnected } = useMqtt({
    topic: 'arec/pump',
    brokerUrl: 'ws://192.168.8.13:9001/mqtt',
    username: 'arec',
    password: 'arecmqtt'
  });

  // Fetch chart data
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await API.get('/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data.reverse();
      setSeries({
        voltage: data.map(d => d.filtered_voltage ?? 0).slice(-20),
        current: data.map(d => d.filtered_current ?? 0).slice(-20),
        power: data.map(d => d.power ?? 0).slice(-20),
        waterflow: data.map(d => d.flow ?? 0).slice(-20)
      });
      if (data.length > 0) {
        setLastRealtime(data[data.length - 1].time || "N/A");
        if (data[data.length - 1].accumulated_energy_wh != null) {
          setEnergyBase(data[0].accumulated_energy_wh);
          setAccumulatedEnergy(Math.max(0, (data[data.length - 1].accumulated_energy_wh - data[0].accumulated_energy_wh) / 1000));
        }
        if (data[data.length - 1].total_water_volume != null) {
          setWaterBase(data[0].total_water_volume);
          setWaterPumped(Math.max(0, data[data.length - 1].total_water_volume - data[0].total_water_volume));
        }
      }
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Fetch fuel prices (gasoline, diesel)
  const fetchFuelPrices = async () => {
    setFuelLoading(true);
    try {
      const [gasRes, dieselRes] = await Promise.all([
        API.get('/gasprice/gasoline'),
        API.get('/gasprice/diesel')
      ]);
      setFuelPrices(prev => ({
        ...prev,
        gasoline: parseFloat(gasRes.data.price), // USD/L
        diesel: parseFloat(dieselRes.data.price) // USD/L
      }));
      setEditPrices(prev => ({
        ...prev,
        gasoline: gasRes.data.price,
        diesel: dieselRes.data.price
      }));
      setFuelError('');
    } catch (err) {
      setFuelError('Failed to fetch fuel prices');
      console.error(err);
    } finally {
      setFuelLoading(false);
    }
  };

  // Fetch AC price (PHP/kWh)
  const fetchACPrice = async () => {
    try {
      const res = await API.get('/electricityprice');
      setFuelPrices(prev => ({ ...prev, ac: res.data.price }));
      setEditPrices(prev => ({ ...prev, ac: res.data.price }));
    } catch (err) {
      setFuelError('Failed to fetch AC price');
    }
  };

  // Fetch USD to PHP conversion rate
  const fetchUsdToPhp = async () => {
    setCurrencyLoading(true);
    try {
      const res = await API.get('/currency/usd-to-php');
      setUsdToPhp(res.data.usd_to_php);
    } catch (err) {
      console.error("Failed to fetch USD to PHP rate", err);
    } finally {
      setCurrencyLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchFuelPrices();
    fetchACPrice();
    fetchUsdToPhp();
    const interval = setInterval(fetchUsdToPhp, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Daily reset logic: resets at midnight
  useEffect(() => {
    const nowDay = new Date().toDateString();
    if (nowDay !== currentDay) {
      setCurrentDay(nowDay);
      setEnergyBase(null);
      setWaterBase(null);
      setAccumulatedEnergy(0);
      setWaterPumped(0);
    }
    const interval = setInterval(() => {
      const today = new Date().toDateString();
      if (today !== currentDay) {
        setCurrentDay(today);
        setEnergyBase(null);
        setWaterBase(null);
        setAccumulatedEnergy(0);
        setWaterPumped(0);
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [currentDay]);

  // Update chart and today's total from MQTT
  useEffect(() => {
    if (lastMessage) {
      setSeries(prev => ({
        voltage: updateSeries(prev.voltage, lastMessage.filtered_voltage ?? 0),
        current: updateSeries(prev.current, lastMessage.filtered_current ?? 0),
        power: updateSeries(prev.power, lastMessage.power ?? 0),
        waterflow: updateSeries(prev.waterflow, lastMessage.flow ?? 0)
      }));

      setLastRealtime(lastMessage.time || "N/A");
      const isPumpOn = (Number(lastMessage.filtered_current) || 0) > 0;
      setPumpOn(isPumpOn);

      if (lastMessage.accumulated_energy_wh != null) {
        if (energyBase === null) {
          setEnergyBase(lastMessage.accumulated_energy_wh);
          setAccumulatedEnergy(0);
        } else {
          setAccumulatedEnergy(
            Math.max(0, (lastMessage.accumulated_energy_wh - energyBase) / 1000)
          );
        }
      }
      if (lastMessage.total_water_volume != null) {
        if (waterBase === null) {
          setWaterBase(lastMessage.total_water_volume);
          setWaterPumped(0);
        } else {
          setWaterPumped(
            Math.max(0, lastMessage.total_water_volume - waterBase)
          );
        }
      }
    }
  }, [lastMessage, energyBase, waterBase]);

  // Compute savings rates from live fuel prices and USD→PHP
  const computePumpSavingsRates = () => ({
    gasoline: fuelPrices.gasoline ? (fuelPrices.gasoline * usdToPhp) / 20 : 64 / 20,
    diesel: fuelPrices.diesel ? (fuelPrices.diesel * usdToPhp) / 25 : 60 / 25,
    ac: fuelPrices.ac ? fuelPrices.ac / 40 : 15 / 40 // AC price is PHP/kWh, no conversion
  });

  // Calculate all savings types (per day) in PHP based on water pumped
  useEffect(() => {
    const rates = computePumpSavingsRates();
    setSavingsValues({
      gasoline: (waterPumped * rates.gasoline).toFixed(2),
      diesel: (waterPumped * rates.diesel).toFixed(2),
      ac: (waterPumped * rates.ac).toFixed(2)
    });
  }, [waterPumped, fuelPrices, usdToPhp]);

  // Fading animation for savings card (auto-advance every 3s)
  useEffect(() => {
    const types = ['gasoline', 'diesel', 'ac'];
    let idx = types.indexOf(savingsType);
    const timer = setTimeout(() => {
      setFadeIn(false);
      setTimeout(() => {
        idx = (idx + 1) % types.length;
        setSavingsType(types[idx]);
        setFadeIn(true);
      }, 350);
    }, 3000);
    return () => clearTimeout(timer);
  }, [savingsType]);

  // Price edit handlers
  const handleEditChange = (field, value) => {
    setEditPrices(prev => ({ ...prev, [field]: value }));
  };
  const handleSavePrices = async () => {
    setFuelLoading(true);
    try {
      // Update gasoline and diesel
      await API.patch('/gasprice/update', {
        type: 'gasoline',
        price: parseFloat(editPrices.gasoline)
      });
      await API.patch('/gasprice/update', {
        type: 'diesel',
        price: parseFloat(editPrices.diesel)
      });
      // Update AC price (in PHP/kWh)
      const token = localStorage.getItem('token');
      await API.patch('/electricityprice/update', {
        price: parseFloat(editPrices.ac)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditMode(false);
      fetchFuelPrices();
      fetchACPrice();
    } catch (err) {
      setFuelError('Failed to update prices');
      setFuelLoading(false);
    }
  };

  const handleChangeSavingsType = (type) => {
    setFadeIn(false);
    setTimeout(() => {
      setSavingsType(type);
      setFadeIn(true);
    }, 350);
  };

  const timeLabels = Array.from({ length: 20 }, (_, i) => `-${19 - i}s`);

  const chartConfigs = [
    {
      label: 'Voltage Graph',
      icon: <OfflineBoltIcon color="primary" sx={{ fontSize: 24, mr: 1 }} />,
      dataKey: 'voltage',
      borderColor: theme.palette.primary.main,
      unit: 'V',
      decimal: 2,
    },
    {
      label: 'Current Graph',
      icon: <SpeedIcon sx={{ color: "#a259d9", fontSize: 24, mr: 1 }} />,
      dataKey: 'current',
      borderColor: "#a259d9",
      unit: 'A',
      decimal: 2,
    },
    {
      label: 'Power Graph',
      icon: <FlashOnIcon sx={{ color: "#ff9800", fontSize: 24, mr: 1 }} />,
      dataKey: 'power',
      borderColor: "#ff9800",
      unit: 'W',
      decimal: 2,
    },
    {
      label: 'Water Flow L/min',
      icon: <OpacityIcon sx={{ color: "#29b6f6", fontSize: 24, mr: 1 }} />,
      dataKey: 'waterflow',
      borderColor: "#29b6f6",
      unit: 'L/min',
      decimal: 2,
    }
  ];

  const renderChartCard = (config, idx) => {
    const value = series[config.dataKey][series[config.dataKey].length - 1];
    const allZero = series[config.dataKey].every(v => v === 0);
    return (
      <Grid item xs={12} md={4} sx={{ display: 'flex' }} key={config.dataKey}>
        <Card elevation={3} sx={{ flexGrow: 1, minHeight: 270, maxHeight: 340, display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <MuiTooltip title={config.label}>
                <span>{config.icon}</span>
              </MuiTooltip>
              <Typography variant="h6" sx={{ fontWeight: 700, ml: 1 }}>{config.label}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  color: config.borderColor,
                  mr: 1,
                  letterSpacing: 1,
                  lineHeight: 1,
                }}
              >
                {Number(value).toFixed(2)}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.text.secondary,
                }}
              >
                {config.unit}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 110, maxHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {allZero ? (
                <Typography color="text.secondary" sx={{ textAlign: "center", width: '100%' }}>
                  No data available yet.
                </Typography>
              ) : (
                <Line
                  data={{
                    labels: timeLabels,
                    datasets: [{
                      label: `${config.label} (${config.unit})`,
                      data: series[config.dataKey].map(v => Number(v).toFixed(2)),
                      fill: false,
                      borderColor: config.borderColor,
                      tension: 0.4,
                      pointRadius: 2,
                      pointHoverRadius: 6,
                      pointHoverBackgroundColor: config.borderColor,
                    }]
                  }}
                  options={{
                    animation: false,
                    maintainAspectRatio: false,
                    scales: {
                      x: { display: false, grid: { color: "#ececec" }, ticks: { color: "#aaa" } },
                      y: { beginAtZero: true, grid: { color: "#ececec" }, ticks: { color: "#aaa" } }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: { enabled: true }
                    }
                  }}
                  height={110}
                />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
              {allZero ? "" : `Last updated: ${lastRealtime}`}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box sx={{
      display: 'flex',
      background: theme.palette.mode === 'light' ? '#f9fafd' : theme.palette.background.default,
      minHeight: '100vh'
    }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        background: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: 0,
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="open drawer"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h4" noWrap component="div" sx={{ fontWeight: 700, flexGrow: 1 }}>
            Dashboard
          </Typography>
          <Box sx={{ ml: 3 }}>
            <Typography variant="body1" color={isConnected ? 'primary' : 'error'}>
              MQTT: {isConnected ? 'Connected' : 'Disconnected'}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} aria-label="sidebar">
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(!mobileOpen)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
        </Drawer>
        <Drawer variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #e0e0e0', background: theme.palette.background.paper }
          }} open>
          <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, width: { md: `calc(100% - ${drawerWidth}px)` }, mt: { xs: 0, md: 0 } }}>
        {/* Fuel Price Box */}
        <Box
  sx={{
    my: 2,
    p: { xs: 2, md: 3 },
    border: '1px solid',
    borderColor: theme.palette.divider,
    borderRadius: 3,
    bgcolor: theme.palette.background.paper,
    boxShadow: 2,
    minHeight: 90,
  }}
>
  <Typography
    variant="h5"
    sx={{
      mb: 2,
      fontWeight: 800,
      letterSpacing: 1,
      color: theme.palette.primary.main,
      textShadow: '0 1px 2px rgba(0,0,0,0.03)'
    }}
  >
    Fuel & Electricity Prices
  </Typography>
  <Box
    sx={{
      display: "flex",
      flexDirection: { xs: "column", sm: "row" },
      alignItems: { xs: "flex-start", sm: "center" },
      gap: 4,
      justifyContent: "space-between",
      flexWrap: "wrap"
    }}
  >
    {/* Gasoline */}
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 220, px: 1 }}>
      <Typography sx={{ minWidth: 94, fontWeight: 700, color: "#ef5350" }}>
        ⛽ Gasoline:  
      </Typography>
      {fuelLoading ? (
        <CircularProgress size={18} />
      ) : editMode ? (
        <TextField
          type="number"
          size="small"
          variant="outlined"
          label="USD/L"
          value={editPrices.gasoline}
          onChange={e => handleEditChange('gasoline', e.target.value)}
          inputProps={{
            step: "0.001",
            min: "0",
          }}
          sx={{
            width: 90,
            mr: 1,
            '& input': { fontWeight: 700 }
          }}
          error={editPrices.gasoline !== '' && Number(editPrices.gasoline) <= 0}
          helperText={editPrices.gasoline !== '' && Number(editPrices.gasoline) <= 0 ? "Enter a valid price" : ""}
        />
      ) : (
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: 22,
            color: "#222"
          }}
        >
          ₱{fuelPrices.gasoline && usdToPhp
            ? (fuelPrices.gasoline * usdToPhp).toFixed(2)
            : '...'
          }
          <Typography component="span" sx={{ fontWeight: 500, color: "#888", fontSize: 14, ml: 1 }}>
            /L
          </Typography>
          <Typography component="span" sx={{ fontWeight: 400, color: "#aaa", fontSize: 13, ml: 1 }}>
            ({fuelPrices.gasoline ?? '...'} USD/L)
          </Typography>
        </Typography>
      )}
    </Box>
    {/* Diesel */}
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 220, px: 1 }}>
      <Typography sx={{ minWidth: 72, fontWeight: 700, color: "#8d6e63" }}>
        🚚 Diesel:
      </Typography>
      {fuelLoading ? (
        <CircularProgress size={18} />
      ) : editMode ? (
        <TextField
          type="number"
          size="small"
          variant="outlined"
          label="USD/L"
          value={editPrices.diesel}
          onChange={e => handleEditChange('diesel', e.target.value)}
          inputProps={{
            step: "0.001",
            min: "0",
          }}
          sx={{
            width: 90,
            mr: 1,
            '& input': { fontWeight: 700 }
          }}
          error={editPrices.diesel !== '' && Number(editPrices.diesel) <= 0}
          helperText={editPrices.diesel !== '' && Number(editPrices.diesel) <= 0 ? "Enter a valid price" : ""}
        />
      ) : (
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: 22,
            color: "#222"
          }}
        >
          ₱{fuelPrices.diesel && usdToPhp
            ? (fuelPrices.diesel * usdToPhp).toFixed(2)
            : '...'
          }
          <Typography component="span" sx={{ fontWeight: 500, color: "#888", fontSize: 14, ml: 1 }}>
            /L
          </Typography>
          <Typography component="span" sx={{ fontWeight: 400, color: "#aaa", fontSize: 13, ml: 1 }}>
            ({fuelPrices.diesel ?? '...'} USD/L)
          </Typography>
        </Typography>
      )}
    </Box>
    {/* Electricity (AC) */}
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 210, px: 1 }}>
      <Typography sx={{ minWidth: 86, fontWeight: 700, color: "#42a5f5" }}>
        ⚡ Electricity:
      </Typography>
      {fuelLoading ? (
        <CircularProgress size={18} />
      ) : editMode ? (
        <TextField
          type="number"
          size="small"
          variant="outlined"
          label="₱/kWh"
          value={editPrices.ac}
          onChange={e => handleEditChange('ac', e.target.value)}
          inputProps={{
            step: "0.01",
            min: "0",
          }}
          sx={{
            width: 90,
            mr: 1,
            '& input': { fontWeight: 700 }
          }}
          error={editPrices.ac !== '' && Number(editPrices.ac) <= 0}
          helperText={editPrices.ac !== '' && Number(editPrices.ac) <= 0 ? "Enter a valid price" : ""}
        />
      ) : (
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: 22,
            color: "#222"
          }}
        >
          ₱{fuelPrices.ac ?? '...'}
          <Typography component="span" sx={{ fontWeight: 500, color: "#888", fontSize: 14, ml: 1 }}>
            /kWh
          </Typography>
        </Typography>
      )}
    </Box>
    {/* USD to PHP */}
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 170, px: 1 }}>
      <Typography sx={{ minWidth: 86, fontWeight: 700, color: "#1976d2" }}>
        💱 USD→PHP:
      </Typography>
      {currencyLoading ? (
        <CircularProgress size={18} />
      ) : (
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 20,
            color: "#1976d2"
          }}
        >
          ₱{usdToPhp}
        </Typography>
      )}
    </Box>
    {/* Edit/Save Buttons */}
    <Box
      sx={{
        ml: { xs: 0, sm: 1 },
        mt: { xs: 2, sm: 0 },
        alignSelf: { xs: "flex-start", sm: "center" },
        display: "flex",
        flexDirection: "row",
        gap: 1,
      }}
    >
      {editMode ? (
        <>
          <Button
            variant="contained"
            size="small"
            color="primary"
            sx={{ fontWeight: 700 }}
            onClick={handleSavePrices}
            disabled={
              [editPrices.gasoline, editPrices.diesel, editPrices.ac].some(
                v => v === '' || Number(v) <= 0
              ) || fuelLoading
            }
          >
            Save
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="secondary"
            sx={{ fontWeight: 700 }}
            onClick={() => setEditMode(false)}
            disabled={fuelLoading}
          >
            Cancel
          </Button>
        </>
      ) : (
        <Button
          variant="outlined"
          size="small"
          color="primary"
          sx={{ fontWeight: 700 }}
          onClick={() => setEditMode(true)}
        >
          Edit Prices
        </Button>
      )}
    </Box>
  </Box>
  {fuelError && <Typography color="error" sx={{ mt: 1, fontWeight: 700 }}>{fuelError}</Typography>}
</Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ maxWidth: 1400, mx: 'auto' }}>
            {chartConfigs.map(renderChartCard)}
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Card elevation={3} sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 270, minWidth:335 }}>
                <CardContent sx={{ width: '100%', textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Pump Status</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={pumpOn}
                          disabled
                          color={pumpOn ? "primary" : "default"}
                          sx={{ transform: 'scale(1.3)' }}
                        />
                      }
                      label={
                        <Typography fontWeight={700} fontSize="1.1rem" color={pumpOn ? "primary" : "error"}>
                          {pumpOn ? 'ON' : 'OFF'}
                        </Typography>
                      }
                      sx={{ mx: 'auto', display: 'block' }}
                    />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <span style={{ color: theme.palette.text.secondary }}>Realtime: </span>
                      <span style={{ color: theme.palette.primary.main, fontWeight: 700 }}>{lastRealtime}</span>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Card elevation={3} sx={{ flexGrow: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <FilterHdrIcon sx={{ color: "#607d8b", mr: 1, fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Accumulated Energy Today
                    </Typography>
                  </Box>
                  <Typography variant="h2" sx={{ color: "#607d8b", fontWeight: 900 }}>
                    {Number(accumulatedEnergy).toFixed(2)} <span style={{ fontSize: 26 }}>kWh</span>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Card elevation={3} sx={{ flexGrow: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 323 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <WaterIcon sx={{ color: "#2196f3", mr: 1, fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Water Pumped Today
                    </Typography>
                  </Box>
                  <Typography variant="h2" sx={{ color: "#2196f3", fontWeight: 900 }}>
                    {Number(waterPumped).toFixed(2)} <span style={{ fontSize: 26 }}>L</span>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Card
                elevation={3}
                sx={{
                  flexGrow: 1,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: 270,
                  minWidth: 335,
                  height: { xs: 300, md: 300 },
                  maxHeight: 300,
                  boxSizing: 'border-box'
                }}
              >
                <CardContent sx={{ width: '100%', height: '100%' }}>
                  <ButtonGroup fullWidth sx={{ mb: 5 }} color="primary" size="small">
                    <Button variant={savingsType === 'gasoline' ? 'contained' : 'outlined'} onClick={() => handleChangeSavingsType('gasoline')}>Gasoline</Button>
                    <Button variant={savingsType === 'diesel' ? 'contained' : 'outlined'} onClick={() => handleChangeSavingsType('diesel')}>Diesel</Button>
                    <Button variant={savingsType === 'ac' ? 'contained' : 'outlined'} onClick={() => handleChangeSavingsType('ac')}>AC</Button>
                  </ButtonGroup>
                  <Box sx={{
                    width: '100%',
                    height: 180,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <Fade in={fadeIn} timeout={350} key={savingsType}>
                      <Box sx={{ width: '100%', position: 'absolute', top: 0, left: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                          <SavingsIcon sx={{ color: PUMP_COLORS[savingsType], mr: 1, fontSize: 28 }} />
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Savings Today ({PUMP_LABELS[savingsType]})
                          </Typography>
                        </Box>
                        <Typography
                          variant="h3"
                          sx={{
                            color: PUMP_COLORS[savingsType],
                            fontWeight: 900,
                            minHeight: 56,
                            lineHeight: 1,
                            mb: 1
                          }}
                        >
                          ₱{Number(savingsValues[savingsType]).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Est. ({Number(waterPumped).toFixed(2)} L)
                        </Typography>
                      </Box>
                    </Fade>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}