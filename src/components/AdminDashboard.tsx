import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import type { Business, Service, Booking } from '../types/salon';
import { LayoutDashboard, Scissors, CalendarCheck, Plus, Check, X, Store, Trash2, Info, Clock, Edit3, DollarSign, Timer, Users } from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [mySalons, setMySalons] = useState<Business[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'bookings'>('overview');

    // Service Management State
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [newService, setNewService] = useState({
        name: '',
        description: '',
        price: '',
        duration_minutes: 30,
        capacity: 1,
        business: 0
    });

    // Salon Editing State
    const [editingSalon, setEditingSalon] = useState<Business | null>(null);
    const [salonFormData, setSalonFormData] = useState({
        name: '',
        address: '',
        map_url: '',
        working_hours: '',
        phone: '',
        description: '',
        open_time: '09:00',
        close_time: '18:00'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [salonsRes, servicesRes, bookingsRes] = await Promise.all([
                    api.get('/api/businesses/'),
                    api.get('/api/services/'),
                    api.get('/api/bookings/business/')
                ]);

                const userSalons = salonsRes.data.data.filter((b: Business) => b.owner === user?.id);
                setMySalons(userSalons);
                setServices(servicesRes.data.data);
                setBookings(bookingsRes.data.data);

                if (userSalons.length > 0) {
                    setNewService((s) => ({ ...s, business: userSalons[0]!.id }));
                }
            } catch (error) {
                console.error('Error fetching admin data:', error);
            } finally {
                setLoading(false);
            }
        };
        if (user?.is_business) fetchData();
    }, [user]);

    const handleOpenCreate = () => {
        setEditingService(null);
        setNewService({
            name: '',
            description: '',
            price: '',
            duration_minutes: 30,
            capacity: 1,
            business: mySalons.length > 0 ? mySalons[0].id : 0
        });
        setShowServiceForm(true);
    };

    const handleOpenEdit = (service: Service) => {
        setEditingService(service);
        setNewService({
            name: service.name,
            description: service.description,
            price: service.price.toString(),
            duration_minutes: service.duration_minutes,
            capacity: service.capacity,
            business: service.business
        });
        setShowServiceForm(true);
    };

    const handleSubmitService = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingService) {
                const response = await api.put(`/api/services/${editingService.id}/`, newService);
                if (response.data.success) {
                    setServices(services.map((s: Service) => s.id === editingService.id ? response.data.data : s));
                    setShowServiceForm(false);
                }
            } else {
                const response = await api.post('/api/services/', newService);
                if (response.data.success) {
                    setServices((prev: Service[]) => [...prev, response.data.data]);
                    setShowServiceForm(false);
                }
            }
        } catch (error) {
            console.error('Error saving service:', error);
            alert('Failed to save service. Please check your inputs.');
        }
    };

    const handleDeleteService = async (serviceId: number) => {
        if (!window.confirm('Are you sure you want to delete this service?')) return;
        try {
            const response = await api.delete(`/api/services/${serviceId}/`);
            if (response.data.success) {
                setServices((prev: Service[]) => prev.filter((s: Service) => s.id !== serviceId));
            }
        } catch (error) {
            console.error('Error deleting service:', error);
        }
    };

    const handleEditSalon = (salon: Business) => {
        setEditingSalon(salon);
        setSalonFormData({
            name: salon.name,
            address: salon.address,
            map_url: salon.map_url || '',
            working_hours: salon.working_hours,
            phone: salon.phone || '', // Restored phone
            description: salon.description || '', // Restored description
            open_time: salon.open_time ? salon.open_time.substring(0, 5) : '09:00',
            close_time: salon.close_time ? salon.close_time.substring(0, 5) : '18:00'
        });
    };

    const handleUpdateBookingStatus = async (bookingId: number, status: string) => {
        try {
            let endpoint = '';
            if (status === 'confirmed') endpoint = 'confirm';
            else if (status === 'completed') endpoint = 'complete';
            else if (status === 'rejected') endpoint = 'reject';

            const response = await api.post(`/api/bookings/${bookingId}/${endpoint}/`, {});
            if (response.data.success) {
                setBookings(bookings.map((b: Booking) => b.id === bookingId ? response.data.data : b));
            }
        } catch (error) {
            console.error('Error updating booking:', error);
            alert('Operation failed. Please try again.');
        }
    };

    const handleSaveSalon = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSalon) {
                // Update existing salon
                const response = await api.put(`/api/businesses/${editingSalon.id}/`, salonFormData);
                if (response.data.success) {
                    setMySalons(mySalons.map((s: Business) => s.id === editingSalon.id ? response.data.data : s));
                    setEditingSalon(null);
                }
            } else {
                // Create new salon
                const response = await api.post('/api/businesses/', salonFormData);
                if (response.data.success) {
                    setMySalons([response.data.data]);
                    setNewService((s) => ({ ...s, business: response.data.data.id }));
                }
            }
        } catch (error: any) {
            console.error('Error saving salon:', error);
            alert(error.response?.data?.message || 'Failed to save salon profile. Please check all fields.');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-400 font-bold animate-pulse">Loading your dashboard...</p>
        </div>
    );

    if (user?.is_business && mySalons.length === 0) {
        return (
            <div className="max-w-3xl mx-auto py-10 px-6 animate-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-12 space-y-4">
                    <div className="bg-indigo-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-100 rotate-3">
                        <Store className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Setup Your <span className="text-indigo-600">Salon</span></h1>
                    <p className="text-gray-500 font-medium text-lg">Create your professional profile to start receiving bookings</p>
                </div>

                <form onSubmit={handleSaveSalon} className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 p-8 md:p-12 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Business Name</label>
                            <input
                                type="text"
                                required
                                placeholder="E.g. Glamour Studio"
                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold focus:ring-4 focus:ring-indigo-50 transition-all"
                                value={salonFormData.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalonFormData({ ...salonFormData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                            <input
                                type="text"
                                required
                                placeholder="+1 234 567 890"
                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold focus:ring-4 focus:ring-indigo-50 transition-all"
                                value={salonFormData.phone}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalonFormData({ ...salonFormData, phone: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Physical Address</label>
                            <input
                                type="text"
                                required
                                placeholder="123 Beauty Lane, Fashion District"
                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold focus:ring-4 focus:ring-indigo-50 transition-all"
                                value={salonFormData.address}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalonFormData({ ...salonFormData, address: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Operating Hours (Text)</label>
                            <input
                                type="text"
                                required
                                placeholder="Mon-Fri 9:00 - 18:00"
                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold focus:ring-4 focus:ring-indigo-50 transition-all"
                                value={salonFormData.working_hours}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalonFormData({ ...salonFormData, working_hours: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Google Maps URL (Optional)</label>
                            <input
                                type="url"
                                placeholder="https://maps.google.com/..."
                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold focus:ring-4 focus:ring-indigo-50 transition-all"
                                value={salonFormData.map_url}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalonFormData({ ...salonFormData, map_url: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">About the Salon</label>
                            <textarea
                                required
                                placeholder="Describe your salon, your specialties, and what customers can expect..."
                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold focus:ring-4 focus:ring-indigo-50 transition-all min-h-[120px]"
                                value={salonFormData.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSalonFormData({ ...salonFormData, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:col-span-2">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Doors Open At</label>
                                <input
                                    type="time"
                                    required
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold focus:ring-4 focus:ring-indigo-50 transition-all"
                                    value={salonFormData.open_time}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalonFormData({ ...salonFormData, open_time: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Doors Close At</label>
                                <input
                                    type="time"
                                    required
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold focus:ring-4 focus:ring-indigo-50 transition-all"
                                    value={salonFormData.close_time}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalonFormData({ ...salonFormData, close_time: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]">
                        Launch My Salon Profile
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4 sm:px-6 lg:px-8">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 mt-4">
                <div className="space-y-1">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight">Business <span className="text-indigo-600">Hub</span></h1>
                    <div className="flex items-center gap-2 text-gray-400 font-bold text-sm">
                        <Store className="w-4 h-4 shrink-0" />
                        <span>Managing {mySalons.length} {mySalons.length === 1 ? 'Location' : 'Locations'}</span>
                    </div>
                </div>

                <div className="bg-white p-1 rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100 flex flex-wrap sm:flex-nowrap gap-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-xl sm:rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-xl sm:rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'services' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Services
                    </button>
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-xl sm:rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'bookings' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Bookings
                    </button>
                </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <div className="bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center">
                                <Store className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Active Salons</p>
                                <h4 className="text-3xl font-black text-gray-900">{mySalons.length}</h4>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center">
                                <Scissors className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Available Services</p>
                                <h4 className="text-3xl font-black text-gray-900">{services.length}</h4>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center">
                                <CalendarCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Total Bookings</p>
                                <h4 className="text-3xl font-black text-gray-900">{bookings.length}</h4>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                        <h3 className="text-2xl font-black text-gray-900">Your Locations</h3>
                        <div className="grid grid-cols-1 gap-6">
                            {mySalons.map(salon => (
                                <div key={salon.id} className="p-8 rounded-3xl bg-gray-50/50 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="space-y-2 text-center md:text-left">
                                        <h4 className="text-xl font-bold text-gray-900">{salon.name}</h4>
                                        <p className="text-gray-500 font-medium text-sm">{salon.address}</p>
                                        <div className="flex flex-wrap gap-3 pt-2">
                                            {salon.map_url && (
                                                <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Has Map Link</span>
                                            )}
                                            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase">{salon.working_hours}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleEditSalon(salon)}
                                        className="px-6 py-3 bg-white border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-all"
                                    >
                                        Update Details
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {editingSalon && (
                        <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-6">
                            <form onSubmit={handleSaveSalon} className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 lg:p-14 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-gray-900">Update Salon Info</h3>
                                    <button type="button" onClick={() => setEditingSalon(null)} className="text-gray-400 hover:text-gray-900"><X /></button>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Salon Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold"
                                            value={salonFormData.name}
                                            onChange={e => setSalonFormData({ ...salonFormData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Address</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold"
                                            value={salonFormData.address}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalonFormData({ ...salonFormData, address: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone</label>
                                            <input
                                                type="text"
                                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold"
                                                value={salonFormData.phone}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalonFormData({ ...salonFormData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Operating Hours</label>
                                            <input
                                                type="text"
                                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold"
                                                value={salonFormData.working_hours}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalonFormData({ ...salonFormData, working_hours: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">About the Salon</label>
                                        <textarea
                                            placeholder="Tell customers what makes your salon special..."
                                            className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold min-h-[100px]"
                                            value={salonFormData.description}
                                            onChange={e => setSalonFormData({ ...salonFormData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Open At</label>
                                            <input
                                                type="time"
                                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold"
                                                value={salonFormData.open_time}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalonFormData({ ...salonFormData, open_time: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Close At</label>
                                            <input
                                                type="time"
                                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold"
                                                value={salonFormData.close_time}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalonFormData({ ...salonFormData, close_time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">Google Maps URL <Info className="w-3 h-3" /></label>
                                        <input
                                            type="url"
                                            placeholder="https://maps.google.com/..."
                                            className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold"
                                            value={salonFormData.map_url}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalonFormData({ ...salonFormData, map_url: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                                    Save Changes
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
                <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 p-8 lg:p-12 space-y-12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-gray-900">Service Catalog</h2>
                            <p className="text-gray-400 font-bold">Manage your treatments and pricing</p>
                        </div>
                        <button
                            onClick={handleOpenCreate}
                            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                        >
                            <Plus className="w-6 h-6" />
                            Launch New Service
                        </button>
                    </div>

                    {showServiceForm && (
                        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
                            <form
                                onSubmit={handleSubmitService}
                                className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 lg:p-14 space-y-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-3xl font-black text-gray-900">
                                        {editingService ? 'Edit Service' : 'New Service'}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowServiceForm(false)}
                                        className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <Scissors className="w-3 h-3" /> Service Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-gray-900"
                                            placeholder="E.g. Full Beard Sculpt"
                                            value={newService.name}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewService({ ...newService, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <DollarSign className="w-3 h-3" /> Price ($)
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-gray-900"
                                            placeholder="35.00"
                                            value={newService.price}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewService({ ...newService, price: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <Timer className="w-3 h-3" /> Duration
                                        </label>
                                        <select
                                            className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-gray-900 appearance-none"
                                            value={newService.duration_minutes}
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewService({ ...newService, duration_minutes: parseInt(e.target.value) })}
                                        >
                                            <option value={15}>15 Minutes</option>
                                            <option value={30}>30 Minutes</option>
                                            <option value={45}>45 Minutes</option>
                                            <option value={60}>1 Hour</option>
                                            <option value={90}>1.5 Hours</option>
                                            <option value={120}>2 Hours</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <Users className="w-3 h-3" /> Staff Slots
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-gray-900"
                                            placeholder="1"
                                            value={newService.capacity}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewService({ ...newService, capacity: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Store className="w-3 h-3" /> Business Location
                                    </label>
                                    <select
                                        className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-gray-900 appearance-none disabled:opacity-50"
                                        disabled={!!editingService}
                                        value={newService.business}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewService({ ...newService, business: parseInt(e.target.value) })}
                                    >
                                        {mySalons.map((salon: Business) => (
                                            <option key={salon.id} value={salon.id}>{salon.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Info className="w-3 h-3" /> Description
                                    </label>
                                    <textarea
                                        className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-gray-900 min-h-[120px] resize-none"
                                        placeholder="What does this service include?"
                                        value={newService.description}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewService({ ...newService, description: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black tracking-widest uppercase text-xs transition-all hover:bg-indigo-700 active:scale-95 shadow-2xl shadow-indigo-100">
                                        {editingService ? 'Save Changes' : 'Create Service'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {services.map((service: Service) => (
                            <div key={service.id} className="p-8 rounded-[2.5rem] border border-gray-100 bg-gray-50/10 hover:bg-white hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-50/50 transition-all flex flex-col sm:flex-row items-center justify-between gap-6 group">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-gray-100 text-indigo-400 group-hover:scale-110 transition-transform">
                                        <Scissors className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xl font-black text-gray-900">{service.name}</h4>
                                        <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-gray-400">
                                            <span className="text-indigo-600">${service.price}</span>
                                            <span className="opacity-30">•</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {service.duration_minutes}m</span>
                                            <span className="opacity-30">•</span>
                                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {service.capacity} Staff</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                    <button
                                        onClick={() => handleOpenEdit(service)}
                                        className="p-4 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl shadow-sm border border-gray-50 transition-all"
                                    >
                                        <Edit3 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteService(service.id)}
                                        className="p-4 bg-white text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl shadow-sm border border-gray-50 transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
                <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
                    <div className="p-8 lg:p-12 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-gray-900">Client Schedule</h2>
                            <p className="text-gray-400 font-bold text-sm">Upcoming appointments and history</p>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-2.5 bg-green-50 text-green-700 rounded-full w-fit">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Tracking</span>
                        </div>
                    </div>

                    <div className="p-4 sm:p-0">
                        {/* Mobile View: Cards */}
                        <div className="sm:hidden space-y-4 p-4">
                            {bookings.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 font-bold">No bookings recorded yet.</div>
                            ) : (
                                bookings.map((booking: Booking) => (
                                    <div key={booking.id} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{booking.service_name}</p>
                                                <h4 className="text-lg font-bold text-gray-900 truncate">Client #{booking.user}</h4>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${booking.status === 'confirmed' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                booking.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    booking.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                                    <CalendarCheck className="w-4 h-4 text-gray-400" />
                                                    {booking.date}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time</p>
                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    {booking.start_time}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-4">
                                            {booking.status === 'pending' && (
                                                <button
                                                    onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100"
                                                >
                                                    Confirm
                                                </button>
                                            )}
                                            {booking.status === 'confirmed' && (
                                                <button
                                                    onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                                                    className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100"
                                                >
                                                    Complete
                                                </button>
                                            )}
                                            {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => handleUpdateBookingStatus(booking.id, 'rejected')}
                                                    className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-bold text-xs uppercase"
                                                >
                                                    Reject
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop View: Table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-10 py-8 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Client & Service</th>
                                        <th className="px-10 py-8 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Scheduled Date</th>
                                        <th className="px-10 py-8 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Current Status</th>
                                        <th className="px-10 py-8 text-xs font-black text-gray-400 uppercase tracking-[0.2em] text-right">Operational Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {bookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-10 py-32 text-center text-gray-400 font-bold">
                                                No bookings recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        bookings.map((booking: Booking) => (
                                            <tr key={booking.id} className="hover:bg-indigo-50/10 transition-colors">
                                                <td className="px-10 py-8">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-black text-gray-900 text-lg">Client #{booking.user}</span>
                                                        <span className="text-sm text-indigo-600 font-black uppercase tracking-widest">{booking.service_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2.5 text-sm font-bold text-gray-500">
                                                            <CalendarCheck className="w-4 h-4 text-indigo-400" />
                                                            {booking.date}
                                                        </div>
                                                        <div className="flex items-center gap-2.5 text-xs font-black text-gray-300">
                                                            <Clock className="w-4 h-4" />
                                                            {booking.start_time} - {booking.end_time}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border ${booking.status === 'confirmed' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                        booking.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                                                            booking.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                'bg-amber-50 text-amber-600 border-amber-100'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {booking.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-1 active:scale-95"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                                Confirm
                                                            </button>
                                                        )}
                                                        {booking.status === 'confirmed' && (
                                                            <button
                                                                onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                                                                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-100 hover:bg-green-700 transition-all hover:-translate-y-1 active:scale-95"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                                Complete
                                                            </button>
                                                        )}
                                                        {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                                                            <button
                                                                onClick={() => handleUpdateBookingStatus(booking.id, 'rejected')}
                                                                className="p-4 bg-white text-rose-500 rounded-2xl border border-rose-50 hover:bg-rose-50 shadow-sm transition-all active:scale-90"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
