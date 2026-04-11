'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, MapPin, User, Calendar, DollarSign } from 'lucide-react'

export interface Ride {
  id: string
  driverName: string
  driverRating: number
  pickupLocation: string
  dropoffLocation: string
  pickupTime: string
  estimatedArrival: string
  price: number
  vehicleType: string
  status: 'pending' | 'confirmed' | 'completed'
}

export interface RideConfirmProps {
  ride?: Ride
  onConfirm?: () => void
  onCancel?: () => void
}

const DEFAULT_RIDE: Ride = {
  id: 'RIDE-2024-001',
  driverName: 'John Smith',
  driverRating: 4.8,
  pickupLocation: '123 Main Street, Downtown',
  dropoffLocation: '456 Oak Avenue, Uptown',
  pickupTime: '2:30 PM',
  estimatedArrival: '2:50 PM',
  price: 24.50,
  vehicleType: 'Sedan',
  status: 'pending',
}

export const RideConfirm: React.FC<RideConfirmProps> = ({
  ride = DEFAULT_RIDE,
  onConfirm = () => {},
  onCancel = () => {},
}) => {
  const [rideStatus, setRideStatus] = useState<'pending' | 'confirmed' | 'completed'>(ride.status)

  const handleConfirm = () => {
    setRideStatus('confirmed')
    onConfirm()
  }

  const getStatusBadge = () => {
    switch (rideStatus) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Confirmed</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Completed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-border">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold text-foreground">Ride Confirmation</CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription className="text-base">
            Review your ride details and confirm your booking
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Driver Information */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">{ride.driverName}</h3>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">Rating:</span>
                  <span className="text-sm font-medium text-foreground">{ride.driverRating} ⭐</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{ride.vehicleType}</span>
              <span>•</span>
              <span>ID: {ride.id}</span>
            </div>
          </div>

          {/* Route Information */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="w-0.5 h-full bg-border my-1 flex-1"></div>
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>Pickup Location</span>
                  </div>
                  <p className="font-medium text-foreground pl-6">{ride.pickupLocation}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>Dropoff Location</span>
                  </div>
                  <p className="font-medium text-foreground pl-6">{ride.dropoffLocation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Time and Price Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Pickup Time</span>
              </div>
              <p className="font-semibold text-lg text-foreground">{ride.pickupTime}</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Est. Arrival</span>
              </div>
              <p className="font-semibold text-lg text-foreground">{ride.estimatedArrival}</p>
            </div>

            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-2 text-primary mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Total Fare</span>
              </div>
              <p className="font-bold text-2xl text-primary">${ride.price.toFixed(2)}</p>
            </div>
          </div>

          {/* Confirmation Status */}
          {rideStatus === 'confirmed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">Ride Confirmed!</p>
                <p className="text-sm text-green-700">Your driver will arrive at the pickup location shortly.</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {rideStatus === 'pending' ? (
              <>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 h-12 text-base font-semibold"
                  size="lg"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Confirm Ride
                </Button>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="flex-1 h-12 text-base font-semibold"
                  size="lg"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                className="w-full h-12 text-base font-semibold"
                size="lg"
                disabled
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Ride Confirmed
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RideConfirm
