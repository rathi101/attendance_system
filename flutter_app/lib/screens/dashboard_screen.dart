import 'package:flutter/material.dart';
import 'dart:async';
import '../services/api_service.dart';
import '../services/location_service.dart';
import 'attendance_screen.dart';

class DashboardScreen extends StatefulWidget {
  final Map<String, dynamic> user;

  DashboardScreen({required this.user});

  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with TickerProviderStateMixin {
  bool _isLoading = false;
  String _statusMessage = '';
  List<dynamic> _notifications = [];
  bool _isPunchedIn = false;
  String _currentTime = '';
  Timer? _timer;
  
  late AnimationController _pulseController;
  late AnimationController _slideController;
  late Animation<double> _pulseAnimation;
  late Animation<Offset> _slideAnimation;
  
  @override
  void initState() {
    super.initState();
    _loadNotifications();
    _startTimer();
    
    _pulseController = AnimationController(
      duration: Duration(milliseconds: 2000),
      vsync: this,
    );
    
    _slideController = AnimationController(
      duration: Duration(milliseconds: 800),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    
    _slideAnimation = Tween<Offset>(begin: Offset(0, 1), end: Offset.zero).animate(
      CurvedAnimation(parent: _slideController, curve: Curves.elasticOut),
    );
    
    _pulseController.repeat(reverse: true);
    _slideController.forward();
  }
  
  void _startTimer() {
    _timer = Timer.periodic(Duration(seconds: 1), (timer) {
      setState(() {
        _currentTime = DateTime.now().toString().substring(11, 19);
      });
    });
  }
  
  @override
  void dispose() {
    _timer?.cancel();
    _pulseController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    try {
      final notifications = await ApiService.getNotifications(widget.user['id']);
      setState(() {
        _notifications = notifications.take(5).toList();
      });
    } catch (e) {
      print('Error loading notifications: $e');
    }
  }

  Future<void> _punchIn() async {
    setState(() {
      _isLoading = true;
      _statusMessage = 'Getting location...';
    });

    try {
      final position = await LocationService.getCurrentLocation();
      if (position == null) {
        setState(() {
          _statusMessage = 'Location permission required';
        });
        return;
      }

      setState(() {
        _statusMessage = 'Punching in...';
      });

      final result = await ApiService.punchIn(
        position.latitude,
        position.longitude,
      );

      setState(() {
        _statusMessage = result['success'] == true
            ? result['message']
            : result['error'] ?? 'Punch in failed';
      });

      if (result['success'] == true) {
        _loadNotifications();
      }
    } catch (e) {
      setState(() {
        _statusMessage = 'Network error. Please try again.';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _punchOut() async {
    setState(() {
      _isLoading = true;
      _statusMessage = 'Getting location...';
    });

    try {
      final position = await LocationService.getCurrentLocation();
      if (position == null) {
        setState(() {
          _statusMessage = 'Location permission required';
        });
        return;
      }

      setState(() {
        _statusMessage = 'Punching out...';
      });

      final result = await ApiService.punchOut(
        position.latitude,
        position.longitude,
      );

      setState(() {
        _statusMessage = result['success'] == true
            ? result['message']
            : result['error'] ?? 'Punch out failed';
      });

      if (result['success'] == true) {
        _loadNotifications();
      }
    } catch (e) {
      setState(() {
        _statusMessage = 'Network error. Please try again.';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _logout() async {
    await ApiService.removeToken();
    Navigator.pushReplacementNamed(context, '/');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Dashboard'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        actions: [
          Stack(
            children: [
              IconButton(
                icon: Icon(Icons.notifications),
                onPressed: () {},
              ),
              if (_notifications.where((n) => !n['read']).isNotEmpty)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    constraints: BoxConstraints(
                      minWidth: 12,
                      minHeight: 12,
                    ),
                    child: Text(
                      '${_notifications.where((n) => !n['read']).length}',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 8,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
      ),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              elevation: 4,
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome, ${widget.user['name']}!',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Role: ${widget.user['role'].toString().toUpperCase()}',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _isLoading ? null : _punchIn,
                    icon: Icon(Icons.login, color: Colors.white),
                    label: Text('Punch In', style: TextStyle(color: Colors.white)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      padding: EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _isLoading ? null : _punchOut,
                    icon: Icon(Icons.logout, color: Colors.white),
                    label: Text('Punch Out', style: TextStyle(color: Colors.white)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      padding: EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 16),
            if (_statusMessage.isNotEmpty)
              Card(
                color: _statusMessage.contains('successfully') 
                    ? Colors.green[50] 
                    : Colors.red[50],
                child: Padding(
                  padding: EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Icon(
                        _statusMessage.contains('successfully') 
                            ? Icons.check_circle 
                            : Icons.error,
                        color: _statusMessage.contains('successfully') 
                            ? Colors.green 
                            : Colors.red,
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _statusMessage,
                          style: TextStyle(
                            color: _statusMessage.contains('successfully') 
                                ? Colors.green[800] 
                                : Colors.red[800],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => AttendanceScreen(user: widget.user),
                      ),
                    );
                  },
                  icon: Icon(Icons.history),
                  label: Text('View History'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue[600],
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
            SizedBox(height: 24),
            Text(
              'Recent Notifications',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            Expanded(
              child: _notifications.isEmpty
                  ? Center(
                      child: Text(
                        'No notifications',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    )
                  : ListView.builder(
                      itemCount: _notifications.length,
                      itemBuilder: (context, index) {
                        final notification = _notifications[index];
                        return Card(
                          margin: EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: Icon(
                              notification['type'] == 'punch_in'
                                  ? Icons.login
                                  : Icons.logout,
                              color: notification['type'] == 'punch_in'
                                  ? Colors.green
                                  : Colors.red,
                            ),
                            title: Text(notification['message']),
                            subtitle: Text(
                              DateTime.parse(notification['timestamp'])
                                  .toLocal()
                                  .toString()
                                  .substring(0, 19),
                            ),
                            trailing: notification['read']
                                ? null
                                : Container(
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      color: Colors.blue,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}