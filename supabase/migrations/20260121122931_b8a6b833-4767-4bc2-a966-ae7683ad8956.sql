-- Create profiles table for user accounts
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    country TEXT,
    city TEXT,
    bio TEXT,
    postcards_given INTEGER NOT NULL DEFAULT 0,
    postcards_received INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create postcards table to track all postcards in the system
CREATE TABLE public.postcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code TEXT NOT NULL UNIQUE,
    owner_id UUID NOT NULL,
    design_type TEXT NOT NULL DEFAULT 'krajoznawczy',
    language TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'purchased' CHECK (status IN ('purchased', 'in_transit', 'delivered')),
    given_to_name TEXT,
    given_to_country TEXT,
    given_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    receiver_id UUID,
    photo_url TEXT,
    message TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on postcards
ALTER TABLE public.postcards ENABLE ROW LEVEL SECURITY;

-- Everyone can view delivered postcards
CREATE POLICY "Delivered postcards are viewable by everyone" 
ON public.postcards 
FOR SELECT 
USING (status = 'delivered' OR auth.uid() = owner_id OR auth.uid() = receiver_id);

-- Users can update their own postcards
CREATE POLICY "Users can update their own postcards" 
ON public.postcards 
FOR UPDATE 
USING (auth.uid() = owner_id);

-- Users can insert their own postcards
CREATE POLICY "Users can insert their own postcards" 
ON public.postcards 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Create platform_stats table for aggregated statistics
CREATE TABLE public.platform_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_members INTEGER NOT NULL DEFAULT 0,
    total_countries INTEGER NOT NULL DEFAULT 0,
    total_given INTEGER NOT NULL DEFAULT 0,
    total_purchased INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on platform_stats
ALTER TABLE public.platform_stats ENABLE ROW LEVEL SECURITY;

-- Everyone can view platform stats
CREATE POLICY "Platform stats are viewable by everyone" 
ON public.platform_stats 
FOR SELECT 
USING (true);

-- Insert initial stats row
INSERT INTO public.platform_stats (total_members, total_countries, total_given, total_purchased)
VALUES (0, 0, 0, 0);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_postcards_updated_at
BEFORE UPDATE ON public.postcards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_stats_updated_at
BEFORE UPDATE ON public.platform_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate unique tracking code
CREATE OR REPLACE FUNCTION public.generate_tracking_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        code := 'PL-' || upper(substr(md5(random()::text), 1, 8));
        SELECT COUNT(*) INTO exists_count FROM public.postcards WHERE tracking_code = code;
        EXIT WHEN exists_count = 0;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create function to update platform stats when postcard status changes
CREATE OR REPLACE FUNCTION public.update_platform_stats_on_postcard()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total_purchased on insert
    IF TG_OP = 'INSERT' THEN
        UPDATE public.platform_stats 
        SET total_purchased = total_purchased + 1;
    END IF;
    
    -- Update total_given when status changes to delivered
    IF TG_OP = 'UPDATE' AND OLD.status != 'delivered' AND NEW.status = 'delivered' THEN
        UPDATE public.platform_stats 
        SET total_given = total_given + 1;
        
        -- Update country count if new country
        IF NEW.given_to_country IS NOT NULL THEN
            UPDATE public.platform_stats 
            SET total_countries = (
                SELECT COUNT(DISTINCT given_to_country) 
                FROM public.postcards 
                WHERE status = 'delivered' AND given_to_country IS NOT NULL
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for platform stats updates
CREATE TRIGGER update_platform_stats_trigger
AFTER INSERT OR UPDATE ON public.postcards
FOR EACH ROW
EXECUTE FUNCTION public.update_platform_stats_on_postcard();

-- Create function to update profile stats
CREATE OR REPLACE FUNCTION public.update_profile_stats_on_postcard()
RETURNS TRIGGER AS $$
BEGIN
    -- Update giver stats when postcard is delivered
    IF TG_OP = 'UPDATE' AND OLD.status != 'delivered' AND NEW.status = 'delivered' THEN
        UPDATE public.profiles 
        SET postcards_given = postcards_given + 1
        WHERE user_id = NEW.owner_id;
        
        -- Update receiver stats if receiver exists
        IF NEW.receiver_id IS NOT NULL THEN
            UPDATE public.profiles 
            SET postcards_received = postcards_received + 1
            WHERE user_id = NEW.receiver_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profile stats updates
CREATE TRIGGER update_profile_stats_trigger
AFTER UPDATE ON public.postcards
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_stats_on_postcard();

-- Create function to update member count
CREATE OR REPLACE FUNCTION public.update_member_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.platform_stats 
    SET total_members = (SELECT COUNT(*) FROM public.profiles);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for member count
CREATE TRIGGER update_member_count_trigger
AFTER INSERT OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_member_count();