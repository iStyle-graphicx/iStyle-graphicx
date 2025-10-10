-- Create function to send notification on delivery status change
CREATE OR REPLACE FUNCTION notify_delivery_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify customer on status change
    IF NEW.status != OLD.status THEN
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (
            NEW.customer_id,
            'Delivery Status Updated',
            'Your delivery status has been updated to: ' || NEW.status,
            'info'
        );

        -- Notify driver if assigned
        IF NEW.driver_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, title, message, type)
            VALUES (
                NEW.driver_id,
                'Delivery Status Updated',
                'Delivery status has been updated to: ' || NEW.status,
                'info'
            );
        END IF;
    END IF;

    -- Notify driver when assigned to delivery
    IF NEW.driver_id IS NOT NULL AND (OLD.driver_id IS NULL OR NEW.driver_id != OLD.driver_id) THEN
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (
            NEW.driver_id,
            'New Delivery Assigned',
            'You have been assigned a new delivery from ' || NEW.pickup_address || ' to ' || NEW.delivery_address,
            'success'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for delivery status changes
DROP TRIGGER IF EXISTS delivery_status_change_trigger ON public.deliveries;
CREATE TRIGGER delivery_status_change_trigger
    AFTER UPDATE ON public.deliveries
    FOR EACH ROW
    EXECUTE FUNCTION notify_delivery_status_change();

-- Create function to notify on driver verification status change
CREATE OR REPLACE FUNCTION notify_driver_verification_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verification_status != OLD.verification_status THEN
        IF NEW.verification_status = 'approved' THEN
            INSERT INTO public.notifications (user_id, title, message, type)
            VALUES (
                NEW.id,
                'Driver Application Approved!',
                'Congratulations! Your driver application has been approved. You can now start accepting deliveries.',
                'success'
            );
        ELSIF NEW.verification_status = 'rejected' THEN
            INSERT INTO public.notifications (user_id, title, message, type)
            VALUES (
                NEW.id,
                'Driver Application Needs Attention',
                'Your driver application requires additional information. Please check your profile for details.',
                'warning'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for driver verification changes
DROP TRIGGER IF EXISTS driver_verification_change_trigger ON public.drivers;
CREATE TRIGGER driver_verification_change_trigger
    AFTER UPDATE ON public.drivers
    FOR EACH ROW
    EXECUTE FUNCTION notify_driver_verification_change();

-- Create function to notify on document expiry (to be called by scheduled job)
CREATE OR REPLACE FUNCTION check_document_expiry()
RETURNS void AS $$
BEGIN
    -- Notify drivers with expiring licenses (within 30 days)
    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT 
        id,
        'Driver License Expiring Soon',
        'Your driver license expires on ' || license_expiry_date::text || '. Please renew it to continue driving.',
        'warning'
    FROM public.drivers
    WHERE license_expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        AND license_expiry_date > CURRENT_DATE
        AND NOT EXISTS (
            SELECT 1 FROM public.notifications
            WHERE user_id = drivers.id
                AND title = 'Driver License Expiring Soon'
                AND created_at > CURRENT_DATE - INTERVAL '7 days'
        );

    -- Notify drivers with expiring insurance (within 30 days)
    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT 
        id,
        'Vehicle Insurance Expiring Soon',
        'Your vehicle insurance expires on ' || insurance_expiry_date::text || '. Please renew it to continue driving.',
        'warning'
    FROM public.drivers
    WHERE insurance_expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        AND insurance_expiry_date > CURRENT_DATE
        AND NOT EXISTS (
            SELECT 1 FROM public.notifications
            WHERE user_id = drivers.id
                AND title = 'Vehicle Insurance Expiring Soon'
                AND created_at > CURRENT_DATE - INTERVAL '7 days'
        );
END;
$$ LANGUAGE plpgsql;
